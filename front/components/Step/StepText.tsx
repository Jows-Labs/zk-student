export const StepText = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="text-center gap-1 flex flex-col max-w-48">
      <p className="font-bold text-lg">{title}</p>
      <p className="text-[#4C4355]">{description}</p>
    </div>
  );
};
