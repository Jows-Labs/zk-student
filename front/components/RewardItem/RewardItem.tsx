import { ReactNode } from "react";

interface RewardItemProps {
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

export function RewardItem({
  icon,
  bgColor,
  iconColor,
  title,
  description,
}: RewardItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`${bgColor} min-w-14 aspect-square p-2 rounded-xl flex items-center justify-center`}
      >
        <div className={`w-full h-full ${iconColor}`}>{icon}</div>
      </div>
      <div className="flex flex-col">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-[#4C4355]">{description}</p>
      </div>
    </div>
  );
}
