import { steps } from "@/lib/steps";
import { StepIcon } from "../Step/StepIcon";
import { StepText } from "../Step/StepText";

export const ZKStudentsSteps = () => {
  const step = 2;

  const columns = steps.length;
  const startOffset = (0.5 / columns) * 100;
  const fillWidth = ((step - 1) / columns) * 100;
  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-x-10 gap-y-6 relative items-start justify-items-center w-full max-w-7xl">
      <div className="absolute inset-x-0 top-10 -translate-y-1/2 h-1 bg-[#CEC2D8]/30 overflow-hidden">
        <div
          className="absolute h-full transition-all duration-500 ease-out bg-gradient-to-r from-[#7C3AED]/30 via-[#8B5CF6]/30 to-[#A78BFA]/30"
          style={{ left: `${startOffset}%`, width: `${fillWidth}%` }}
        ></div>
      </div>
      {steps.map(({ Icon }, index) => (
        <StepIcon key={Icon.name} Icon={Icon} active={index < step} />
      ))}
      {steps.map(({ title, description }) => (
        <StepText key={title} title={title} description={description} />
      ))}
    </div>
  );
};
