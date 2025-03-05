import React from "react";

function SavingCard({ plan }) {
  const { name, icon, iconBg, progress, amount, target } = plan;

  return (
    <article className="flex gap-4 p-4 rounded-2xl bg-slate-800">
      <div
        className={`flex justify-center items-center w-10 h-10 text-white ${iconBg} rounded-lg`}
      >
        <i className={`ti ${icon}`} />
      </div>
      <div className="flex-1">
        <h3 className="mb-2 text-sm text-white">{name}</h3>
        <div className="mb-2 h-1 rounded-sm bg-white bg-opacity-10">
          <div className={`${progress} h-full bg-blue-500 rounded-sm`} />
        </div>
        <p className="mb-4 text-2xl font-semibold text-white">
          <span>{amount}</span>
          <span className="ml-2 text-xs text-slate-500">Target: {target}</span>
        </p>
      </div>
    </article>
  );
}

export default SavingCard;
