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

  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setExpired(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setExpired(true);
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
    <div className="flex flex-col items-center gap-2 py-6" role="timer" aria-live="polite" aria-label={expired ? 'Evento já celebrado' : 'Contagem regressiva para o evento'}>
      <div className="flex gap-4 md:gap-8 justify-center">
        <TimeBox val={timeLeft.days} label="Dias" />
        <div className="text-xl opacity-30 self-start mt-2" aria-hidden="true">:</div>
        <TimeBox val={timeLeft.hours} label="Hrs" />
        <div className="text-xl opacity-30 self-start mt-2" aria-hidden="true">:</div>
        <TimeBox val={timeLeft.minutes} label="Min" />
        <div className="text-xl opacity-30 self-start mt-2" aria-hidden="true">:</div>
        <TimeBox val={timeLeft.seconds} label="Seg" />
      </div>
      {expired && (
        <p className={`text-sm md:text-base font-serif italic ${colorClass}`}>Celebrado com amor — obrigado por teres vindo</p>
      )}
    </div>
  );
};
