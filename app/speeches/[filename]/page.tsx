import type { Metadata, ResolvingMetadata } from "next";
import { getSpeech, getSpeeches } from "@/utils/speeches";
import { Pen, Clock } from "lucide-react";
import ShareButton from "./share";
import Markdown from "@/components/Markdown";
import SpeechContent from "@/components/SpeechContent";
import SpeechAI from "@/components/SpeechAI";
import { notFound } from "next/navigation";

export const runtime = "edge";

type Props = {
  params: {
    filename: string;
  };
};
type Params = Promise<{
  filename: string;
}>;
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // read route params
  const { filename } = await params;

  // fetch data
  const speech = await getSpeech(filename);

  // Handle case where speech is not found
  if (!speech) {
    notFound();
  }

  const speakers = [
    // @ts-ignore - Already handled null speech case
    ...new Set(speech.content.map((item: any) => item.speaker)),
  ].join("、");
  return {
    title: speech.info.name,
    description: `時間：${speech.info.date}${
      speech.info.time ? " " + speech.info.time : ""
    }\n與會人士：${speakers}`,
    openGraph: {
      images: [
        {
          url: `/api/og/speech?data=${encodeURIComponent(
            JSON.stringify({
              title: speech.info.name,
              speakers,
              date:
                speech.info.date +
                (speech.info.time ? " " + speech.info.time : ""),
            }),
          )}`,
        },
      ],
    },
  } as Metadata;
}
export default async function Page({ params }: { params: Params }) {
  const { filename } = await params;
  const speech = await getSpeech(filename);

  // Handle case where speech is not found
  if (!speech) {
    notFound();
  }

  const name =
    speech.info.name ||
    decodeURIComponent(filename).split(".").slice(0, -1).join(".");
  const date =
    speech.info.date + (speech.info.time ? " " + speech.info.time : "");
  const description = speech.info?.description;
  return (
    <div className="container my-10">
      <div className="text-2xl font-bold text-gray-800 md:text-4xl dark:text-white">
        {name}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-200">
          <Clock size={16} />
          {date}
        </div>
        <div className="flex gap-2 self-end">
          <ShareButton />
          <a
            href={`https://transpal-editor.juchunko.com/?file=${filename}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 sm:px-3 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Pen size={16} />
            <span className="hidden sm:inline">編輯</span>
          </a>
        </div>
      </div>
      {description && (
        <div className="prose prose-sm dark:prose-invert my-6 w-full">
          <div className="h-[2px] w-full rounded-full bg-current opacity-10" />
          <div className="prose prose-sm dark:prose-invert my-6 w-full break-all">
            <Markdown>{description || ""}</Markdown>
          </div>
          <div className="h-[2px] w-full rounded-full bg-current opacity-10" />
        </div>
      )}
      <SpeechContent content={speech.content} filename={filename} />
      <SpeechAI filename={filename} />
    </div>
  );
}
