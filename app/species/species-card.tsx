"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import SpeciesDetailDialog, { type Species } from "./species-detail-dialog";

interface SpeciesCardProps {
  species: Species;
  className?: string;
  sessionId?: string | null;
}


export default function SpeciesCard({ species, className, sessionId}: SpeciesCardProps) {
  const { id, common_name, scientific_name, description, image } = species ?? {};

  const PLACEHOLDER = "/images/placeholder-species.jpg";

  const initialSrc = image ?? PLACEHOLDER;
  const [imgSrc, setImgSrc] = React.useState<string>(initialSrc);

  React.useEffect(() => {
    setImgSrc(image ?? PLACEHOLDER);
  }, [image, id]);

  const handleImageError = () => {
    if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
  };

  return (
    <article
      className={cn(
        "m-2 w-72 rounded-xl border bg-background p-4 shadow-sm",
        "flex flex-col justify-between",
        className
      )}
      data-species-id={id}
    >
      <header className="flex items-center gap-3">
        {imgSrc ? (
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted relative">
            <Image
              src={imgSrc}
              alt={
                common_name
                  ? `${common_name} thumbnail`
                  : scientific_name ?? "Species thumbnail"
              }
              width={48}
              height={48}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          </div>
        ) : (
          <div className="h-12 w-12 flex-shrink-0 rounded-md bg-muted" />
        )}

        <div>
          <h3 className="text-sm font-semibold">{common_name ?? "Unnamed"}</h3>
          <p className="text-xs text-muted-foreground italic">{scientific_name ?? ""}</p>
        </div>
      </header>

      <section className="mt-3 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description ?? "No brief description available."}
        </p>
      </section>

      <footer className="mt-4 flex justify-end">
        <SpeciesDetailDialog
          species={species}
          sessionId={sessionId}
          triggerChildren={<span className="text-sm">Learn more</span>}
        />
      </footer>
    </article>
  );
}
