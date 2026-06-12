import React, { useEffect, useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';

interface Deal {
  id: number;
  startup: { name: string; logo: string; industry: string };
  amount: string;
  equity: string;
  status: string;
  stage: string;
  lastActivity: string;
  notes?: string;
}

const DEALS_STORAGE_KEY = 'business_nexus_deals';

const defaultDeals: Deal[] = [
  {
    id: 1,
    startup: {
      name: 'TechWave AI',
      logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      industry: 'FinTech'
    },
    amount: '$1.5M',
    equity: '15%',
    status: 'Due Diligence',
    stage: 'Series A',
    lastActivity: '2026-05-15',
    notes: 'Reviewing financials and customer references. Pitch deck shared in the document chamber.'
  },
  {
    id: 2,
    startup: {
      name: 'GreenLife Solutions',
      logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      industry: 'CleanTech'
    },
    amount: '$2M',
    equity: '20%',
    status: 'Term Sheet',
    stage: 'Seed',
    lastActivity: '2026-05-10',
    notes: 'Term sheet sent for e-signature. Awaiting founder response.'
  },
  {
    id: 3,
    startup: {
      name: 'HealthPulse',
      logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      industry: 'HealthTech'
    },
    amount: '$800K',
    equity: '12%',
    status: 'Negotiation',
    stage: 'Pre-seed',
    lastActivity: '2026-05-05',
    notes: 'Negotiating valuation. Follow-up meeting scheduled.'
  }
];

function loadDeals(): Deal[] {
  try {
    const stored = localStorage.getItem(DEALS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* fall through to defaults */
  }
  return defaultDeals;
}

/** Parses "$1.5M" / "$800K" into dollars for the stats row. */
function parseAmount(amount: string): number {
  const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  if (/m/i.test(amount)) return num * 1_000_000;
  if (/k/i.test(amount)) return num * 1_000;
  return num;
}

function formatMillions(total: number): string {
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `$${Math.round(total / 1_000)}K`;
  return `$${total}`;
}

const STATUSES = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];
const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>(loadDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [detailsDeal, setDetailsDeal] = useState<Deal | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    industry: '',
    amount: '',
    equity: '',
    stage: 'Seed',
    status: 'Due Diligence',
    notes: ''
  });

  // Persist the pipeline locally so demo changes survive a reload
  useEffect(() => {
    localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
  }, [deals]);

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Due Diligence':
        return 'primary';
      case 'Term Sheet':
        return 'secondary';
      case 'Negotiation':
        return 'accent';
      case 'Closed':
        return 'success';
      case 'Passed':
        return 'error';
      default:
        return 'gray';
    }
  };

  const filteredDeals = deals.filter(deal => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      deal.startup.name.toLowerCase().includes(q) ||
      deal.startup.industry.toLowerCase().includes(q);
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(deal.status);
    return matchesSearch && matchesStatus;
  });

  const activeDeals = deals.filter(d => !['Closed', 'Passed'].includes(d.status));
  const totalInvestment = deals
    .filter(d => d.status !== 'Passed')
    .reduce((sum, d) => sum + parseAmount(d.amount), 0);
  const closedCount = deals.filter(d => d.status === 'Closed').length;

  const updateDealStatus = (id: number, status: string) => {
    setDeals(prev =>
      prev.map(d =>
        d.id === id ? { ...d, status, lastActivity: new Date().toISOString().slice(0, 10) } : d
      )
    );
    setDetailsDeal(prev => (prev && prev.id === id ? { ...prev, status } : prev));
    toast.success(`Deal moved to ${status}`);
  };

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.amount || !addForm.equity) {
      toast.error('Startup name, amount, and equity are required');
      return;
    }
    const newDeal: Deal = {
      id: Date.now(),
      startup: {
        name: addForm.name,
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(addForm.name)}&background=random`,
        industry: addForm.industry || 'Other'
      },
      amount: addForm.amount.startsWith('$') ? addForm.amount : `$${addForm.amount}`,
      equity: addForm.equity.endsWith('%') ? addForm.equity : `${addForm.equity}%`,
      status: addForm.status,
      stage: addForm.stage,
      lastActivity: new Date().toISOString().slice(0, 10),
      notes: addForm.notes
    };
    setDeals(prev => [newDeal, ...prev]);
    setIsAddOpen(false);
    setAddForm({ name: '', industry: '', amount: '', equity: '', stage: 'Seed', status: 'Due Diligence', notes: '' });
    toast.success(`${newDeal.startup.name} added to your pipeline`);
  };

  const selectClass =
    'block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>

        <Button leftIcon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
          Add Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">{formatMillions(totalInvestment)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">{activeDeals.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pipeline Companies</p>
                <p className="text-lg font-semibold text-gray-900">{deals.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed Deals</p>
                <p className="text-lg font-semibold text-gray-900">{closedCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(status => (
                <Badge
                  key={status}
                  variant={selectedStatus.includes(status) ? getStatusColor(status) : 'gray'}
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Deals ({filteredDeals.length})
          </h2>
        </CardHeader>
        <CardBody>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No deals match your filters</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus([]);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Startup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.map(deal => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={deal.startup.logo}
                            alt={deal.startup.name}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {deal.startup.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.startup.industry}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.equity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(deal.status)}>
                          {deal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.stage}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(deal.lastActivity).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outline" size="sm" onClick={() => setDetailsDeal(deal)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Deal details modal */}
      <Modal
        isOpen={!!detailsDeal}
        onClose={() => setDetailsDeal(null)}
        title={detailsDeal ? `Deal: ${detailsDeal.startup.name}` : ''}
      >
        {detailsDeal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={detailsDeal.startup.logo} alt={detailsDeal.startup.name} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{detailsDeal.startup.name}</p>
                <p className="text-sm text-gray-500">{detailsDeal.startup.industry}</p>
              </div>
              <Badge variant={getStatusColor(detailsDeal.status)} className="ml-auto">
                {detailsDeal.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="font-semibold text-gray-900">{detailsDeal.amount}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase">Equity</p>
                <p className="font-semibold text-gray-900">{detailsDeal.equity}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase">Stage</p>
                <p className="font-semibold text-gray-900">{detailsDeal.stage}</p>
              </div>
            </div>

            {detailsDeal.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{detailsDeal.notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Update status</p>
              <select
                className={selectClass}
                value={detailsDeal.status}
                onChange={(e) => updateDealStatus(detailsDeal.id, e.target.value)}
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500">
              Last activity: {new Date(detailsDeal.lastActivity).toLocaleDateString()}
            </p>
          </div>
        )}
      </Modal>

      {/* Add deal modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Deal">
        <form onSubmit={handleAddDeal} className="space-y-4">
          <Input
            label="Startup name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="e.g. UrbanFarm"
            fullWidth
            required
          />
          <Input
            label="Industry"
            value={addForm.industry}
            onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })}
            placeholder="e.g. AgTech"
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              placeholder="$500K"
              fullWidth
              required
            />
            <Input
              label="Equity"
              value={addForm.equity}
              onChange={(e) => setAddForm({ ...addForm, equity: e.target.value })}
              placeholder="10%"
              fullWidth
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                className={selectClass}
                value={addForm.stage}
                onChange={(e) => setAddForm({ ...addForm, stage: e.target.value })}
              >
                {STAGES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className={selectClass}
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className={selectClass}
              rows={2}
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              placeholder="Optional context for this deal"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<Plus size={16} />}>
              Add Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
