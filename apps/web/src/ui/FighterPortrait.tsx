import React from "react";
import type { CharacterDef } from "@aipuf/contracts";

interface FighterPortraitProps {
  char: CharacterDef;
  className?: string;
  imgClassName?: string;
}

export const FighterPortrait: React.FC<FighterPortraitProps> = ({
  char,
  className = "",
  imgClassName = "h-full w-full object-cover object-[center_20%]",
}) => {
  if (char.portraitUrl) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img
          src={char.portraitUrl}
          alt={char.name}
          className={imgClassName}
          draggable={false}
        />
      </div>
    );
  }

  const initial = char.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`flex items-center justify-center font-arcade font-black text-white ${className}`}
      style={{ background: `linear-gradient(145deg, ${char.colors[0]}, ${char.colors[1] ?? char.colors[0]})` }}
      aria-label={char.name}
    >
      <span className="text-3xl drop-shadow">{initial}</span>
    </div>
  );
};
