import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { paymentService, ApiTransaction } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { User } from '../../types';

type Action = 'deposit' | 'withdraw' | 'transfer';

const statusVariant: Record<ApiTransaction['status'], 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'error'
};

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<User[]>([]);

  const [action, setAction] = useState<Action | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    Promise.all([paymentService.getWallet(), paymentService.listTransactions()])
      .then(([wallet, txns]) => {
        setBalance(wallet.balance);
        setTransactions(txns);
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    userService.listUsers().then(setContacts).catch(() => setContacts([]));
  }, []);

  if (!user) return null;

  const closeModal = () => {
    setAction(null);
    setAmount('');
    setNote('');
    setRecipientId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!action || isNaN(value) || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'deposit') {
        const res = await paymentService.deposit(value, note || undefined);
        setBalance(res.balance);
        toast.success(`Deposited ${usd(value)}`);
      } else if (action === 'withdraw') {
        const res = await paymentService.withdraw(value, note || undefined);
        setBalance(res.balance);
        toast.success(`Withdrew ${usd(value)}`);
      } else {
        if (!recipientId) {
          toast.error('Select a recipient');
          setIsSubmitting(false);
          return;
        }
        const res = await paymentService.transfer(recipientId, value, note || undefined);
        setBalance(res.balance);
        toast.success(`Transferred ${usd(value)}`);
      }
      closeModal();
      load();
    } catch (err) {
      // Failed transactions (e.g. insufficient funds) are still recorded
      toast.error((err as Error).message);
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIn = transactions
    .filter((t) => t.direction === 'in' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.direction === 'out' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const describeTxn = (t: ApiTransaction): string => {
    if (t.type === 'deposit') return 'Wallet deposit';
    if (t.type === 'withdraw') return 'Wallet withdrawal';
    const other = t.counterparty?.name || 'user';
    return t.direction === 'out' ? `Transfer to ${other}` : `Transfer from ${other}`;
  };

  const actionTitles: Record<Action, string> = {
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Funds',
    transfer: 'Transfer Funds'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your wallet and view transaction history</p>
      </div>

      {/* Wallet + stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-600 text-white md:col-span-1">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-100 flex items-center gap-1">
                  <Wallet size={15} /> Available Balance
                </p>
                <h2 className="text-3xl font-bold mt-1">
                  {balance === null ? '—' : usd(balance)}
                </h2>
                <p className="text-xs text-primary-200 mt-1">Sandbox wallet (mock payments)</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<ArrowDownToLine size={15} />}
                onClick={() => setAction('deposit')}
              >
                Deposit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<ArrowUpFromLine size={15} />}
                onClick={() => setAction('withdraw')}
              >
                Withdraw
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Send size={15} />}
                onClick={() => setAction('transfer')}
              >
                Transfer
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center h-full">
            <div className="p-3 bg-success-50 rounded-full mr-4">
              <ArrowDownLeft size={20} className="text-success-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total In</p>
              <h3 className="text-xl font-semibold text-gray-900">{usd(totalIn)}</h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center h-full">
            <div className="p-3 bg-error-50 rounded-full mr-4">
              <ArrowUpRight size={20} className="text-error-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Out</p>
              <h3 className="text-xl font-semibold text-gray-900">{usd(totalOut)}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-600">No transactions yet</p>
              <p className="text-sm text-gray-500">Make a deposit to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{describeTxn(t)}</p>
                        {t.note && <p className="text-xs text-gray-500">{t.note}</p>}
                        {t.failureReason && (
                          <p className="text-xs text-error-500">{t.failureReason}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{t.reference}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {format(new Date(t.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[t.status]} size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 text-right font-semibold ${
                          t.status === 'failed'
                            ? 'text-gray-400 line-through'
                            : t.direction === 'in'
                            ? 'text-success-700'
                            : 'text-gray-900'
                        }`}
                      >
                        {t.direction === 'in' ? '+' : '-'}
                        {usd(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action modal */}
      <Modal isOpen={!!action} onClose={closeModal} title={action ? actionTitles[action] : ''}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {action === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                required
              >
                <option value="">Select a user...</option>
                {contacts
                  .filter((c) => c.id !== user.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <Input
            label="Amount (USD)"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            fullWidth
            required
          />

          <Input
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Seed contribution"
            fullWidth
          />

          {action === 'deposit' && (
            <p className="text-xs text-gray-500">
              Sandbox mode: deposits simulate a successful card charge.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
