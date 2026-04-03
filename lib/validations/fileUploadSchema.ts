import { z } from "zod";

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  contentType: z.string().min(1, "Content type is required"),
  isImage: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
