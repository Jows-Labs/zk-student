import { ReactNode } from "react";

interface Reward {
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

interface ProtocolRewardsProps {
  rewards: Reward[];
}

export function ProtocolRewards({ rewards }: ProtocolRewardsProps) {
  return (
    <div className="flex flex-col gap-8 justify-start items-start p-6 border h-fit w-100 rounded-3xl bg-white/60 backdrop-blur-sm border-white/20">
      <p className="text-2xl">Protocol Rewards</p>
      <div className="flex flex-col gap-4 items-start w-full">
        {rewards.map((reward, index) => (
          <div key={index} className="flex items-center gap-4">
            <div
              className={`${reward.bgColor} min-w-14 aspect-square p-2 rounded-xl flex items-center justify-center`}
            >
              <div className={`w-full h-full ${reward.iconColor}`}>
                {reward.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold">{reward.title}</p>
              <p className="text-[#4C4355]">{reward.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
