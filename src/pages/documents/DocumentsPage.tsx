import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  Eye,
  PenLine,
  CheckCircle2,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SignaturePad } from '../../components/documents/SignaturePad';
import { useAuth } from '../../context/AuthContext';
import { documentService, ApiDocument } from '../../services/documentService';
import { userService } from '../../services/userService';
import { User } from '../../types';

const statusVariant: Record<ApiDocument['status'], 'gray' | 'warning' | 'primary' | 'success'> = {
  draft: 'gray',
  in_review: 'warning',
  final: 'primary',
  signed: 'success'
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <FileImage size={20} className="text-accent-500" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet size={20} className="text-success-500" />;
  return <FileText size={20} className="text-primary-600" />;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Modals
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [signDoc, setSignDoc] = useState<ApiDocument | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [shareDoc, setShareDoc] = useState<ApiDocument | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);

  const loadDocuments = useCallback(() => {
    documentService
      .list()
      .then(setDocuments)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadDocuments();
    userService.listUsers().then(setContacts).catch(() => setContacts([]));
  }, [loadDocuments]);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setIsUploading(true);
      try {
        for (const file of accepted) {
          await documentService.upload(file);
        }
        toast.success(
          accepted.length === 1 ? `Uploaded ${accepted[0].name}` : `Uploaded ${accepted.length} files`
        );
        loadDocuments();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [loadDocuments]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    maxSize: 10 * 1024 * 1024
  });

  if (!user) return null;

  const openPreview = async (doc: ApiDocument) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    try {
      const url = await documentService.download(doc.id, true);
      setPreviewUrl(url);
    } catch (err) {
      toast.error((err as Error).message);
      setPreviewDoc(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const handleDownload = async (doc: ApiDocument) => {
    try {
      const url = await documentService.download(doc.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSign = async (signature: string) => {
    if (!signDoc) return;
    setIsSigning(true);
    try {
      await documentService.sign(signDoc.id, signature);
      toast.success('Document signed');
      setSignDoc(null);
      loadDocuments();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSigning(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc || !shareUserId) return;
    try {
      await documentService.share(shareDoc.id, shareUserId);
      toast.success('Document shared');
      setShareDoc(null);
      setShareUserId('');
      loadDocuments();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (doc: ApiDocument) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    try {
      await documentService.remove(doc.id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const myDocs = documents.filter((d) => d.owner.id === user.id);
  const sharedDocs = documents.filter((d) => d.owner.id !== user.id);
  const totalBytes = myDocs.reduce((sum, d) => sum + d.size, 0);

  const renderRow = (doc: ApiDocument) => {
    const isOwner = doc.owner.id === user.id;
    const alreadySigned = doc.signatures.some((s) => s.user.id === user.id);
    const canPreview =
      doc.mimeType === 'application/pdf' || doc.mimeType.startsWith('image/');

    return (
      <div
        key={doc.id}
        className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-gray-100 last:border-0"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-gray-50 rounded-md">{fileIcon(doc.mimeType)}</div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
            <p className="text-xs text-gray-500">
              {formatBytes(doc.size)} · v{doc.version} ·{' '}
              {isOwner ? 'You' : doc.owner.name} · {format(new Date(doc.createdAt), 'MMM d, yyyy')}
            </p>
            {doc.signatures.length > 0 && (
              <p className="text-xs text-success-700 flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} />
                Signed by {doc.signatures.map((s) => s.user.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant[doc.status]} size="sm">
            {doc.status.replace('_', ' ')}
          </Badge>
          {doc.sharedWith.length > 0 && isOwner && (
            <Badge variant="gray" size="sm">
              shared ({doc.sharedWith.length})
            </Badge>
          )}

          {canPreview && (
            <Button variant="ghost" size="xs" onClick={() => openPreview(doc)} aria-label="Preview">
              <Eye size={16} />
            </Button>
          )}
          <Button variant="ghost" size="xs" onClick={() => handleDownload(doc)} aria-label="Download">
            <Download size={16} />
          </Button>
          {!alreadySigned && (
            <Button variant="ghost" size="xs" onClick={() => setSignDoc(doc)} aria-label="Sign">
              <PenLine size={16} />
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="ghost" size="xs" onClick={() => setShareDoc(doc)} aria-label="Share">
                <Share2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleDelete(doc)}
                aria-label="Delete"
                className="text-error-500"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" {...getRootProps()}>
      <input {...getInputProps()} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Upload, share, and e-sign your documents</p>
        </div>
        <Button leftIcon={<Upload size={18} />} onClick={open} isLoading={isUploading}>
          Upload Document
        </Button>
      </div>

      {isDragActive && (
        <div className="fixed inset-0 z-40 bg-primary-600/20 border-4 border-dashed border-primary-600 flex items-center justify-center pointer-events-none">
          <p className="text-xl font-semibold text-primary-700 bg-white px-6 py-3 rounded-lg shadow">
            Drop files to upload
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage summary */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">{formatBytes(totalBytes)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full"
                  style={{ width: `${Math.min(100, (totalBytes / (100 * 1024 * 1024)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documents</span>
                <span className="font-medium text-gray-900">{myDocs.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shared with me</span>
                <span className="font-medium text-gray-900">{sharedDocs.length}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              Max 10 MB per file. PDF, Office, text and image files supported. Drag &amp; drop
              anywhere on this page.
            </p>
          </CardBody>
        </Card>

        {/* Document lists */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">My Documents ({myDocs.length})</h2>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">Loading documents...</p>
              ) : myDocs.length > 0 ? (
                myDocs.map(renderRow)
              ) : (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600">No documents yet</p>
                  <p className="text-sm text-gray-500">Upload your pitch deck or contracts</p>
                </div>
              )}
            </CardBody>
          </Card>

          {sharedDocs.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Shared with Me ({sharedDocs.length})
                </h2>
              </CardHeader>
              <CardBody>{sharedDocs.map(renderRow)}</CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={closePreview}
        title={previewDoc?.name}
        maxWidth="max-w-4xl"
      >
        {previewUrl ? (
          previewDoc?.mimeType.startsWith('image/') ? (
            <img src={previewUrl} alt={previewDoc.name} className="max-h-[70vh] mx-auto" />
          ) : (
            <iframe src={previewUrl} title={previewDoc?.name} className="w-full h-[70vh] rounded" />
          )
        ) : (
          <p className="text-center py-12 text-gray-500">Loading preview...</p>
        )}
      </Modal>

      {/* Sign modal */}
      <Modal isOpen={!!signDoc} onClose={() => setSignDoc(null)} title={`Sign: ${signDoc?.name}`}>
        <SignaturePad onSign={handleSign} isSubmitting={isSigning} />
      </Modal>

      {/* Share modal */}
      <Modal isOpen={!!shareDoc} onClose={() => setShareDoc(null)} title={`Share: ${shareDoc?.name}`}>
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Share with</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={shareUserId}
              onChange={(e) => setShareUserId(e.target.value)}
              required
            >
              <option value="">Select a user...</option>
              {contacts
                .filter(
                  (c) =>
                    c.id !== user.id &&
                    !shareDoc?.sharedWith.some((s) => s.id === c.id)
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShareDoc(null)}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<Share2 size={16} />}>
              Share
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
