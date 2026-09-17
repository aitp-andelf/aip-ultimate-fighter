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
  imgClassName = "h-full w-full object-cover object-top",
}) => {
  if (char.portraitUrl) {
    return (
      <div className={className}>
        <img src={char.portraitUrl} alt={char.name} className={imgClassName} />
      </div>
    );
  }

  return (
    <span className={`flex items-center justify-center font-arcade font-black text-white ${className}`}>
      {char.name.charAt(0)}
    </span>
  );
};
