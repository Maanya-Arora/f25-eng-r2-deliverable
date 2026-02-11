"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import EditSpeciesDialog from "@/app/species/edit-species-dialog";

export interface Species {
  id: number | string;
  scientific_name?: string | null;
  common_name?: string | null;
  total_population?: number | null;
  kingdom?: string | null;
  description?: string | null;
  image?: string | null;
  extra?: Record<string, unknown>;
  author?: string | null;
}

interface Props {
  species: Species;
  triggerClassName?: string;
  triggerChildren?: React.ReactNode;
  sessionId?: string | null;
  onSpeciesUpdated?: (updated: Species) => void;
}

export default function SpeciesDetailDialog({
  species,
  triggerClassName,
  triggerChildren,
  sessionId,
  onSpeciesUpdated,
}: Props) {
  const router = useRouter();

  const [localSpecies, setLocalSpecies] = React.useState<Species>(species);
  React.useEffect(() => {
    setLocalSpecies(species);
  }, [species]);

  const formattedPopulation =
    typeof localSpecies.total_population === "number"
      ? localSpecies.total_population.toLocaleString()
      : null;

  const [open, setOpen] = React.useState<boolean>(false);

  const canEdit =
    Boolean(sessionId) && Boolean(localSpecies.author) && sessionId === localSpecies.author;

  const PLACEHOLDER = "/images/placeholder-species.jpg";
  const initialSrc = localSpecies.image ?? PLACEHOLDER;
  const [imgSrc, setImgSrc] = React.useState<string>(initialSrc);

  React.useEffect(() => {
    setImgSrc(localSpecies.image ?? PLACEHOLDER);
  }, [localSpecies.image, localSpecies.id]);

  const handleImageError = (): void => {
    if (imgSrc !== PLACEHOLDER) setImgSrc(PLACEHOLDER);
  };

  const handleSaved = (updated: Partial<Species> & { id: number | string }): void => {
    setLocalSpecies((prev) => ({ ...prev, ...updated }));

    onSpeciesUpdated?.({ ...localSpecies, ...updated });

    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className={cn("text-sm p-0 underline", triggerClassName)}
          onClick={() => setOpen(true)}
          type="button"
        >
          {triggerChildren ?? "Learn more"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {localSpecies.common_name ?? localSpecies.scientific_name ?? "Species details"}
          </DialogTitle>
          <DialogDescription>
            {localSpecies.scientific_name ? (
              <em className="block">Scientific name: {localSpecies.scientific_name}</em>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {imgSrc ? (
          <div className="mt-4 w-full">
            <div className="relative h-56 w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={imgSrc}
                alt={
                  localSpecies.common_name
                    ? `${localSpecies.common_name} image`
                    : localSpecies.scientific_name ?? "Species image"
                }
                fill
                sizes="100vw"
                style={{ objectFit: "cover" }}
                onError={handleImageError}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium">Kingdom</h4>
            <p className="text-sm text-muted-foreground">{localSpecies.kingdom ?? "—"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium">Total population</h4>
            <p className="text-sm text-muted-foreground">{formattedPopulation ?? "Unknown"}</p>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {localSpecies.description ?? "No description available."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <div className="flex items-center gap-3">
            {canEdit ? (
              <EditSpeciesDialog
                species={localSpecies}
                triggerChildren={<span className="text-sm">Edit</span>}
                onSaved={(updated) => {
                  handleSaved(updated);
                }}
              />
            ) : null}
          </div>

          <DialogClose asChild>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
