import React from 'react';

import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';

import { Button } from '@/shared/ui/atoms/Button';
import { Tab } from '@/shared/ui/atoms/Tab';
import { Modal } from '@/shared/ui/composites/Modal';
import { SnackBar } from '@/shared/ui/composites/SnackBar';
import { Spotlight } from '@/shared/ui/composites/Spotlight';
import { useToast } from '@/shared/ui/composites/Toast';

type DebugTab = 'modal' | 'toast' | 'snackbar' | 'spotlight' | 'global-modal';

const TAB_ITEMS = [
  { value: 'modal', label: 'Modal' },
  { value: 'toast', label: 'Toast' },
  { value: 'snackbar', label: 'SnackBar' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'global-modal', label: 'Global Modal' },
] satisfies { value: DebugTab; label: string }[];

const GLOBAL_MODAL_TYPES = [
  'userEdit',
  'planChange',
  'createMultiSession',
  'comingSoon',
  'couponModal',
] as const;

const DebugShellPage = () => {
  const [activeTab, setActiveTab] = React.useState<DebugTab>('modal');

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-bold text-fg">Shell Component Debug</h1>

      <Tab
        items={TAB_ITEMS}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as DebugTab)}
        variant="pill"
        size="sm"
      />

      <div className="rounded-lg border border-border bg-surface p-6">
        {activeTab === 'modal' && <ModalSection />}
        {activeTab === 'toast' && <ToastSection />}
        {activeTab === 'snackbar' && <SnackBarSection />}
        {activeTab === 'spotlight' && <SpotlightSection />}
        {activeTab === 'global-modal' && <GlobalModalSection />}
      </div>
    </div>
  );
};

// ── Modal ──

function ModalSection() {
  const [basicOpen, setBasicOpen] = React.useState(false);
  const [fullOpen, setFullOpen] = React.useState(false);
  const [noCloseOpen, setNoCloseOpen] = React.useState(false);
  const [longOpen, setLongOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">Modal</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setBasicOpen(true)}>
          Basic Modal
        </Button>
        <Button tone="secondary" onClick={() => setFullOpen(true)}>
          With Title & Description
        </Button>
        <Button tone="neutral" onClick={() => setNoCloseOpen(true)}>
          No Close Button
        </Button>
        <Button tone="accent" onClick={() => setLongOpen(true)}>
          Long Content (Scroll)
        </Button>
      </div>

      <Modal open={basicOpen} onOpenChange={setBasicOpen}>
        <p className="text-fg-secondary">Basic modal content.</p>
      </Modal>

      <Modal
        open={fullOpen}
        onOpenChange={setFullOpen}
        title="Modal Title"
        description="This is a description for the modal."
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">Modal body content goes here.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFullOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" onClick={() => setFullOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={noCloseOpen}
        onOpenChange={setNoCloseOpen}
        title="No Close Button"
        hideCloseButton
        closeOnOverlay={false}
      >
        <div className="space-y-4">
          <p className="text-fg-secondary">
            Close button is hidden and overlay click is disabled.
          </p>
          <Button tone="primary" onClick={() => setNoCloseOpen(false)}>
            Close via Button
          </Button>
        </div>
      </Modal>

      <Modal open={longOpen} onOpenChange={setLongOpen} title="Long Content">
        <div className="space-y-3">
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i} className="text-fg-secondary">
              Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
              elit.
            </p>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ── Toast ──

function ToastSection() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">Toast</h2>

      <div className="flex flex-wrap gap-3">
        <Button
          tone="primary"
          onClick={() => toast({ title: 'Basic Toast' })}
        >
          Basic
        </Button>
        <Button
          tone="secondary"
          onClick={() =>
            toast({
              title: 'With Description',
              description: 'This toast has a description text.',
            })
          }
        >
          With Description
        </Button>
        <Button
          tone="accent"
          onClick={() =>
            toast({
              title: 'With Action',
              description: 'Click the action button.',
              action: {
                label: 'Undo',
                onClick: () => alert('Undo clicked'),
              },
            })
          }
        >
          With Action
        </Button>
        <Button
          tone="neutral"
          onClick={() =>
            toast({ title: 'Persistent Toast', duration: 0 })
          }
        >
          No Auto-Close (duration=0)
        </Button>
        <Button
          tone="danger"
          onClick={() => {
            for (let i = 1; i <= 5; i++) {
              toast({ title: `Stacked Toast #${i}` });
            }
          }}
        >
          5x Stacked
        </Button>
      </div>
    </div>
  );
}

// ── SnackBar ──

function SnackBarSection() {
  const [basicOpen, setBasicOpen] = React.useState(false);
  const [actionOpen, setActionOpen] = React.useState(false);
  const [persistOpen, setPersistOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">SnackBar</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setBasicOpen(true)}>
          Basic SnackBar
        </Button>
        <Button tone="secondary" onClick={() => setActionOpen(true)}>
          With Action
        </Button>
        <Button tone="neutral" onClick={() => setPersistOpen(true)}>
          Persistent (duration=0)
        </Button>
      </div>

      <SnackBar
        open={basicOpen}
        message="This is a basic snackbar message."
        onOpenChange={setBasicOpen}
      />
      <SnackBar
        open={actionOpen}
        message="Snackbar with action button."
        action={{
          label: 'Retry',
          onClick: () => alert('Retry clicked'),
        }}
        onOpenChange={setActionOpen}
      />
      <SnackBar
        open={persistOpen}
        message="This snackbar won't auto-close."
        duration={0}
        onOpenChange={setPersistOpen}
      />
    </div>
  );
}

// ── Spotlight ──

function SpotlightSection() {
  const [active, setActive] = React.useState(false);
  const [position, setPosition] = React.useState<
    'top' | 'bottom' | 'left' | 'right'
  >('bottom');
  const clearSpotlight = useQuestStore((s) => s.clearSpotlight);

  const handleClose = React.useCallback(() => {
    setActive(false);
    clearSpotlight();
  }, [clearSpotlight]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">Spotlight</h2>

      <div className="flex flex-wrap gap-3">
        <Button tone="primary" onClick={() => setActive(true)}>
          Activate Spotlight
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-secondary">Position:</span>
          {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
            <Button
              key={pos}
              size="sm"
              variant={position === pos ? 'solid' : 'outline'}
              tone="neutral"
              onClick={() => setPosition(pos)}
            >
              {pos}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-center py-8">
        <Spotlight
          isActive={active}
          tooltip={`Spotlight tooltip (${position})`}
          tooltipPosition={position}
          onClose={handleClose}
        >
          <div className="rounded-lg bg-primary-100 px-6 py-4 text-primary-700">
            Spotlight Target Element
          </div>
        </Spotlight>
      </div>
    </div>
  );
}

// ── Global Modal (via modalStore) ──

function GlobalModalSection() {
  const openModal = useModalStore((s) => s.openModal);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-fg">
        Global Modal (modalStore)
      </h2>
      <p className="text-sm text-fg-muted">
        These modals are rendered by GlobalModalContainer via portal.
      </p>

      <div className="flex flex-wrap gap-3">
        {GLOBAL_MODAL_TYPES.map((type) => (
          <Button
            key={type}
            tone="neutral"
            variant="outline"
            onClick={() => openModal(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default DebugShellPage;
