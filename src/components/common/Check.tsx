import "./Check.css";

interface CheckProps {
  checkActive: boolean;
}

export default function Check({ checkActive }: CheckProps) {
  return (
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path className={`first-stroke ${checkActive ? "active" : ""}`} d="M9 44L46 80" />
        <path className={`second-stroke ${checkActive ? "active" : ""}`} d="M38 72 L91 18" />
      </svg>
    </div>
  );
}
