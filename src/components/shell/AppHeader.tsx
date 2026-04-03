import type { ReactNode } from "react";
import {
  BurgerIcon,
  ChangelogIcon,
  ExportIcon,
  FitIcon,
  FocusIcon,
  ResetIcon,
  SettingsIcon,
} from "../icons";

type HeaderActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "primary";
  children: ReactNode;
};

function HeaderActionButton({
  label,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
  children,
}: HeaderActionButtonProps) {
  return (
    <div className="topbar-action-item">
      <button
        type="button"
        className={`topbar-icon-button${
          variant === "primary" ? " is-primary" : ""
        }${active ? " is-active" : ""}`}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
      <span className="topbar-action-tooltip" role="tooltip">
        {label}
      </span>
    </div>
  );
}

type MobileMenuActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "primary";
  children: ReactNode;
};

function MobileMenuActionButton({
  label,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
  children,
}: MobileMenuActionButtonProps) {
  return (
    <button
      type="button"
      className={`mobile-menu-action${
        variant === "primary" ? " is-primary" : ""
      }${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mobile-menu-action-icon" aria-hidden="true">
        {children}
      </span>
      <span>{label}</span>
    </button>
  );
}

type AppHeaderProps = {
  isPreviewFocused: boolean;
  isMobileHeader: boolean;
  isMobileMenuOpen: boolean;
  canExport: boolean;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenChangelog: () => void;
  onTogglePreviewFocus: () => void;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onResetPreview: () => void;
  onFitPreview: () => void;
};

export function AppHeader({
  isPreviewFocused,
  isMobileHeader,
  isMobileMenuOpen,
  canExport,
  onOpenSettings,
  onOpenExport,
  onOpenChangelog,
  onTogglePreviewFocus,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onResetPreview,
  onFitPreview,
}: AppHeaderProps) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icon.svg" alt="" />
          <div className="brand-copy">
            <h1>Mermaid Generator</h1>
          </div>
        </div>
        <div className="topbar-actions">
          {isPreviewFocused ? <div className="focus-pill">Preview focus</div> : null}
          {!isMobileHeader ? (
            <div className="topbar-action-row">
              <HeaderActionButton
                label="Reset preview position"
                onClick={onResetPreview}
                disabled={!canExport}
              >
                <ResetIcon />
              </HeaderActionButton>
              <HeaderActionButton
                label="Fit preview"
                onClick={onFitPreview}
                disabled={!canExport}
              >
                <FitIcon />
              </HeaderActionButton>
              <HeaderActionButton
                label={isPreviewFocused ? "Exit preview focus" : "Focus preview"}
                onClick={onTogglePreviewFocus}
                disabled={!canExport}
                active={isPreviewFocused}
              >
                <FocusIcon />
              </HeaderActionButton>
              <HeaderActionButton label="Open changelog history" onClick={onOpenChangelog}>
                <ChangelogIcon />
              </HeaderActionButton>
              <HeaderActionButton
                label="Open export dialog"
                onClick={onOpenExport}
                disabled={!canExport}
                variant="primary"
              >
                <ExportIcon />
              </HeaderActionButton>
              <HeaderActionButton label="Open settings" onClick={onOpenSettings}>
                <SettingsIcon />
              </HeaderActionButton>
            </div>
          ) : (
            <button
              type="button"
              className="topbar-menu-toggle"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
              onClick={onToggleMobileMenu}
            >
              <BurgerIcon />
            </button>
          )}
        </div>
      </header>

      {isMobileHeader && isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close navigation menu"
            onClick={onCloseMobileMenu}
          />
          <div
            className="mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="mobile-menu-header">
              <div>
                <h2 id="mobile-menu-title">Navigation menu</h2>
                <p className="panel-subtitle">
                  Open workspace actions without leaving the mobile layout.
                </p>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                aria-label="Close navigation menu"
                onClick={onCloseMobileMenu}
              >
                Close
              </button>
            </div>
            <div className="mobile-menu-group">
              <MobileMenuActionButton label="Open settings" onClick={onOpenSettings}>
                <SettingsIcon />
              </MobileMenuActionButton>
              <MobileMenuActionButton
                label="Open changelog history"
                onClick={onOpenChangelog}
              >
                <ChangelogIcon />
              </MobileMenuActionButton>
              <MobileMenuActionButton
                label="Open export dialog"
                onClick={onOpenExport}
                disabled={!canExport}
                variant="primary"
              >
                <ExportIcon />
              </MobileMenuActionButton>
            </div>
            <div className="mobile-menu-group">
              <MobileMenuActionButton
                label="Reset preview position"
                onClick={onResetPreview}
                disabled={!canExport}
              >
                <ResetIcon />
              </MobileMenuActionButton>
              <MobileMenuActionButton
                label="Fit preview"
                onClick={onFitPreview}
                disabled={!canExport}
              >
                <FitIcon />
              </MobileMenuActionButton>
              <MobileMenuActionButton
                label={isPreviewFocused ? "Exit preview focus" : "Focus preview"}
                onClick={onTogglePreviewFocus}
                disabled={!canExport}
                active={isPreviewFocused}
              >
                <FocusIcon />
              </MobileMenuActionButton>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
