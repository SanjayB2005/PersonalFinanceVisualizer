import React from "react";

function SavingCard({ plan }) {
  const { name, icon, iconBg, progress, amount, target } = plan;

  return (
    <article className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-slate-800">
      <div
        className={`flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-white ${iconBg} rounded-lg flex-shrink-0`}
      >
        <i className={`ti ${icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="mb-2 text-sm text-white truncate">{name}</h3>
        <div className="mb-2 h-1 rounded-sm bg-white bg-opacity-10">
          <div className={`${progress} h-full bg-blue-500 rounded-sm`} />
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline">
          <p className="text-xl md:text-2xl font-semibold text-white">{amount}</p>
          <p className="text-xs text-slate-500 md:ml-2">Target: {target}</p>
        </div>
      </div>
    </article>
  );
}

export default SavingCard;