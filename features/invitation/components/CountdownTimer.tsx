import React, { useState, useEffect } from "react";

export const CountdownTimer: React.FC<{ targetDate: string; colorClass?: string }> = ({
  targetDate,
  colorClass = "text-[#BF9B30]",
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[60px]">
      <span
        className={`text-2xl md:text-3xl font-serif font-bold tabular-nums ${colorClass}`}
      >
        {val < 10 ? `0${val}` : val}
      </span>
      <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-4 md:gap-8 justify-center py-6">
      <TimeBox val={timeLeft.days} label="Dias" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.hours} label="Hrs" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.minutes} label="Min" />
    </div>
  );
};
