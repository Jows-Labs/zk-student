import { IconType } from "react-icons";

export const StepIcon = ({
  Icon,
  active,
}: {
  Icon: IconType;
  active: boolean;
}) => {
  return (
    <div
      className={`p-6 shadow-md rounded-xl w-fit h-fit bg-white z-1 border-2 transition-colors ${
        active ? "border-[#7F20E4]" : "border-transparent"
      }`}
    >
      <Icon className="w-8 h-auto" />
    </div>
  );
};
