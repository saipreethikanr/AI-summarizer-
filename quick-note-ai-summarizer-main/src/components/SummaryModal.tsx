
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Brain } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
}

const SummaryModal = ({ isOpen, onClose, title, summary }: SummaryModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 whitespace-pre-line leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
