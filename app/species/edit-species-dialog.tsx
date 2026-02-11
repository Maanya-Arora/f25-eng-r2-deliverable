"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createClient } from "@supabase/supabase-js";

export interface EditSpeciesValues {
  id: number | string;
  common_name?: string | null;
  scientific_name?: string | null;
  kingdom?: string | null;
  total_population?: number | null;
  image?: string | null;
  description?: string | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const schema = z.object({
  common_name: z.string().min(1, "Common name is required"),
  scientific_name: z.string().optional().nullable(),
  kingdom: z.string().optional().nullable(),
  total_population: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      const n = typeof val === "string" ? Number(val.replace(/,/g, "")) : Number(val);
      return Number.isNaN(n) ? null : n;
    })
    .nullable(),
  image: z
    .union([z.string().url().optional().nullable(), z.literal("")])
    .transform((v) => (v === "" ? null : (v as string | null))),
  description: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

const SpeciesRowSchema = z.object({
  id: z.union([z.number(), z.string()]),
  common_name: z.string().nullable(),
  scientific_name: z.string().nullable(),
  kingdom: z.string().nullable(),
  total_population: z.number().nullable(),
  image: z.string().nullable(),
  description: z.string().nullable(),
  author: z.string().nullable().optional(),
});

interface Props {
  species: EditSpeciesValues;
  triggerChildren?: React.ReactElement;
  onSaved?: (updated: EditSpeciesValues) => void;
}

export default function EditSpeciesDialog({
  species,
  triggerChildren,
  onSaved,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      common_name: species.common_name ?? "",
      scientific_name: species.scientific_name ?? "",
      kingdom: species.kingdom ?? "",
      total_population: species.total_population ?? null,
      image: species.image ?? "",
      description: species.description ?? "",
    },
  });

  React.useEffect(() => {
    form.reset({
      common_name: species.common_name ?? "",
      scientific_name: species.scientific_name ?? "",
      kingdom: species.kingdom ?? "",
      total_population: species.total_population ?? null,
      image: species.image ?? "",
      description: species.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species.id]);

  const doSave = async (values: FormValues): Promise<void> => {
    setSubmitting(true);
    try {
      const payload = {
        common_name: values.common_name,
        scientific_name: values.scientific_name ?? null,
        kingdom: values.kingdom ?? null,
        total_population: values.total_population ?? null,
        image: values.image ?? null,
        description: values.description ?? null,
      };


      console.log("EditSpeciesDialog species.id =", species.id, "type =", typeof species.id);
      const { data, error } = await supabase
        .from("species")
        .update(payload)
        .eq("id", species.id)
        .select("id, common_name, scientific_name, kingdom, total_population, image, description, author")
        .maybeSingle();

      if (error) {
        console.error("Supabase update error:", error);
        window.alert("Failed to update species: " + error.message);
        return;
      }

      if (!data) {
        window.alert(
          "Update did not return a row. This usually means the id didn't match any row, or you aren't authorized to edit this species."
        );
        return;
      }

      const parsed = SpeciesRowSchema.parse(data as unknown);

      const updated: EditSpeciesValues = {
        id: parsed.id,
        common_name: parsed.common_name,
        scientific_name: parsed.scientific_name,
        kingdom: parsed.kingdom,
        total_population: parsed.total_population,
        image: parsed.image,
        description: parsed.description,
      };

      onSaved?.(updated);
      setOpen(false);
      router.refresh();

    } catch (err) {
      console.error("Unexpected error while updating species:", err);
      window.alert("An unexpected error occurred while updating the species.");
    } finally {
      setSubmitting(false);
    }
  };

  const onValid: SubmitHandler<FormValues> = (values) => {
    void doSave(values);
  };

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    void form.handleSubmit(onValid)();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-sm p-0 underline" type="button">
          {triggerChildren ?? <span>Edit</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit species</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="common_name">Common name</Label>
            <Input id="common_name" {...form.register("common_name")} />
            {typeof form.formState.errors.common_name?.message === "string" ? (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.common_name.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="scientific_name">Scientific name</Label>
            <Input id="scientific_name" {...form.register("scientific_name")} />
          </div>

          <div>
            <Label htmlFor="kingdom">Kingdom</Label>
            <Input id="kingdom" {...form.register("kingdom")} />
          </div>

          <div>
            <Label htmlFor="total_population">Total population</Label>
            <Input id="total_population" {...form.register("total_population")} />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" {...form.register("image")} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...form.register("description")} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
