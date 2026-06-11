import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  Plus,
  Video,
  Check,
  X,
  Clock,
  CalendarClock,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { meetingService, ApiMeeting } from '../../services/meetingService';
import { userService } from '../../services/userService';
import { User } from '../../types';

const statusVariant: Record<string, 'warning' | 'success' | 'error' | 'gray'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'gray'
};

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The other role can be invited (entrepreneurs invite investors and vice versa)
  const [contacts, setContacts] = useState<User[]>([]);
  const [form, setForm] = useState({
    participantId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMeetings = () => {
    meetingService
      .listMeetings()
      .then(setMeetings)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMeetings();
    if (user) {
      const otherRole = user.role === 'entrepreneur' ? 'investor' : 'entrepreneur';
      userService
        .listUsers(otherRole)
        .then(setContacts)
        .catch(() => setContacts([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const resetForm = () =>
    setForm({ participantId: '', title: '', description: '', date: '', startTime: '', endTime: '' });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.participantId || !form.title || !form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startISO = new Date(`${form.date}T${form.startTime}`).toISOString();
    const endISO = new Date(`${form.date}T${form.endTime}`).toISOString();

    setIsSubmitting(true);
    try {
      await meetingService.createMeeting({
        participantId: form.participantId,
        title: form.title,
        description: form.description,
        startTime: startISO,
        endTime: endISO
      });
      toast.success('Meeting scheduled');
      setIsModalOpen(false);
      resetForm();
      loadMeetings();
    } catch (err) {
      // Backend returns 409 with a clear message on double-booking
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await meetingService.respond(id, status);
      toast.success(`Meeting ${status}`);
      loadMeetings();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const cancel = async (id: string) => {
    try {
      await meetingService.cancel(id);
      toast.success('Meeting cancelled');
      loadMeetings();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const upcoming = meetings.filter(
    (m) => !isPast(new Date(m.endTime)) && m.status !== 'cancelled' && m.status !== 'rejected'
  );
  const others = meetings.filter((m) => !upcoming.includes(m));

  const renderMeeting = (m: ApiMeeting) => {
    const isOrganizer = m.organizer.id === user.id;
    const counterpart = isOrganizer ? m.participant : m.organizer;
    const canJoin = m.status === 'accepted' && !isPast(new Date(m.endTime));

    return (
      <div key={m.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar src={counterpart.avatarUrl} alt={counterpart.name} size="md" />
            <div>
              <h3 className="font-semibold text-gray-900">{m.title}</h3>
              <p className="text-sm text-gray-500">
                {isOrganizer ? 'With' : 'Invited by'} {counterpart.name}
              </p>
              {m.description && <p className="text-sm text-gray-600 mt-1">{m.description}</p>}
            </div>
          </div>
          <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar size={15} />
            {format(new Date(m.startTime), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={15} />
            {format(new Date(m.startTime), 'h:mm a')} – {format(new Date(m.endTime), 'h:mm a')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {canJoin && (
            <Button
              size="sm"
              leftIcon={<Video size={16} />}
              onClick={() => navigate(`/call/${m.roomId}`)}
            >
              Join Call
            </Button>
          )}

          {/* Invitee can accept/reject a pending invite */}
          {!isOrganizer && m.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                leftIcon={<Check size={16} />}
                onClick={() => respond(m.id, 'accepted')}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<X size={16} />}
                onClick={() => respond(m.id, 'rejected')}
              >
                Decline
              </Button>
            </>
          )}

          {/* Organizer can cancel an active meeting */}
          {isOrganizer && ['pending', 'accepted'].includes(m.status) && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Trash2 size={16} />}
              onClick={() => cancel(m.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your calls</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Schedule Meeting
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading meetings...</div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <CalendarClock size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600">No meetings yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Schedule a meeting to start collaborating
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Upcoming ({upcoming.length})</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {upcoming.length > 0 ? (
                upcoming.map(renderMeeting)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming meetings</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Past & Declined ({others.length})</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {others.length > 0 ? (
                others.map(renderMeeting)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nothing here yet</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule a Meeting"
      >
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite {user.role === 'entrepreneur' ? 'investor' : 'entrepreneur'}
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={form.participantId}
              onChange={(e) => setForm({ ...form, participantId: e.target.value })}
              required
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {(c as User & { startupName?: string }).startupName
                    ? ` — ${(c as User & { startupName?: string }).startupName}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Series A pitch discussion"
            fullWidth
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional agenda"
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            fullWidth
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              fullWidth
              required
            />
            <Input
              label="End time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              fullWidth
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} leftIcon={<Calendar size={18} />}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
