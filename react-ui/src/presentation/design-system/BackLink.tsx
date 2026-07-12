import { FiArrowLeft } from "react-icons/fi";

type BackLinkProps = {
  label: string;
  onClick: () => void;
};

export function BackLink({ label, onClick }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45 transition-colors hover:text-white cursor-pointer"
    >
      <FiArrowLeft />
      {label}
    </button>
  );
}
