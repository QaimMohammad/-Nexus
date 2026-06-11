import React, { useState } from 'react';
import { User as UserIcon, Lock, ShieldCheck, Save } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur, Investor } from '../../types';

// role literals conflict between the two interfaces, so omit them for updates
type ProfileUpdates = Partial<Omit<Entrepreneur, 'role'> & Omit<Investor, 'role'>>;

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, forgotPassword } = useAuth();

  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    // entrepreneur fields
    startupName: (user as Entrepreneur)?.startupName || '',
    pitchSummary: (user as Entrepreneur)?.pitchSummary || '',
    fundingNeeded: (user as Entrepreneur)?.fundingNeeded || '',
    industry: (user as Entrepreneur)?.industry || '',
    location: (user as Entrepreneur)?.location || '',
    // investor fields (comma-separated in the UI)
    investmentInterests: ((user as Investor)?.investmentInterests || []).join(', '),
    investmentStage: ((user as Investor)?.investmentStage || []).join(', '),
    minimumInvestment: (user as Investor)?.minimumInvestment || '',
    maximumInvestment: (user as Investor)?.maximumInvestment || ''
  }));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  if (!user) return null;

  const isEntrepreneur = user.role === 'entrepreneur';

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: ProfileUpdates = {
        name: form.name,
        bio: form.bio
      };
      if (form.avatarUrl) updates.avatarUrl = form.avatarUrl;

      if (isEntrepreneur) {
        Object.assign(updates, {
          startupName: form.startupName,
          pitchSummary: form.pitchSummary,
          fundingNeeded: form.fundingNeeded,
          industry: form.industry,
          location: form.location
        });
      } else {
        Object.assign(updates, {
          investmentInterests: form.investmentInterests
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          investmentStage: form.investmentStage
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          minimumInvestment: form.minimumInvestment,
          maximumInvestment: form.maximumInvestment
        });
      }

      await updateProfile(user.id, updates);
    } catch {
      /* toast shown by updateProfile */
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    const next = !twoFactorEnabled;
    setIsSavingSecurity(true);
    try {
      await updateProfile(user.id, { twoFactorEnabled: next });
      setTwoFactorEnabled(next);
    } catch {
      /* toast shown by updateProfile */
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await forgotPassword(user.email);
    } catch {
      /* toast shown by forgotPassword */
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile settings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <UserIcon size={18} className="text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Profile</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                <Input
                  label="Avatar URL"
                  value={form.avatarUrl}
                  onChange={set('avatarUrl')}
                  placeholder="https://..."
                  fullWidth
                />
              </div>

              <Input label="Full name" value={form.name} onChange={set('name')} fullWidth required />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  rows={3}
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder="Tell others about yourself"
                />
              </div>

              {isEntrepreneur ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Startup name"
                      value={form.startupName}
                      onChange={set('startupName')}
                      fullWidth
                    />
                    <Input label="Industry" value={form.industry} onChange={set('industry')} fullWidth />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Funding needed"
                      value={form.fundingNeeded}
                      onChange={set('fundingNeeded')}
                      placeholder="$1.5M"
                      fullWidth
                    />
                    <Input label="Location" value={form.location} onChange={set('location')} fullWidth />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pitch summary
                    </label>
                    <textarea
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      rows={2}
                      value={form.pitchSummary}
                      onChange={set('pitchSummary')}
                      placeholder="One-paragraph summary of your startup"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Input
                    label="Investment interests (comma-separated)"
                    value={form.investmentInterests}
                    onChange={set('investmentInterests')}
                    placeholder="FinTech, SaaS, AI/ML"
                    fullWidth
                  />
                  <Input
                    label="Investment stages (comma-separated)"
                    value={form.investmentStage}
                    onChange={set('investmentStage')}
                    placeholder="Seed, Series A"
                    fullWidth
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Minimum investment"
                      value={form.minimumInvestment}
                      onChange={set('minimumInvestment')}
                      placeholder="$250K"
                      fullWidth
                    />
                    <Input
                      label="Maximum investment"
                      value={form.maximumInvestment}
                      onChange={set('maximumInvestment')}
                      placeholder="$1.5M"
                      fullWidth
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Security settings */}
        <Card className="h-fit">
          <CardHeader className="flex items-center gap-2">
            <Lock size={18} className="text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Security</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-primary-600" />
                    Two-factor authentication
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Require a one-time code sent to your email on every login.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFactorEnabled}
                  onClick={handleToggle2FA}
                  disabled={isSavingSecurity}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  } ${isSavingSecurity ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transform transition-transform ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {twoFactorEnabled && (
                <p className="text-xs text-success-700 mt-2">
                  2FA is on — you'll be asked for a 6-digit code at login.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                We'll email you a secure link to reset your password.
              </p>
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                Send password reset email
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
              <p>
                Account: <span className="font-medium text-gray-900">{user.email}</span>
              </p>
              <p className="mt-1">
                Role: <span className="font-medium text-gray-900 capitalize">{user.role}</span>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
