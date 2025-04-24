import type { Metadata, ResolvingMetadata } from "next";
import { getSpeech } from "@/utils/speeches";
import Avatar from "@/components/Avatar";
import { Quote, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Share from "./share";
import { notFound } from "next/navigation";

export const runtime = "edge";

type Params = Promise<{
  filename: string;
  messageId: string;
}>;
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // read route params
  const { filename, messageId } = await params;

  // fetch data
  const speech = await getSpeech(filename);

  // Handle case where speech is not found
  if (!speech) {
    notFound();
  }

  const message = speech.content.find((item: any) => item.id === messageId);

  // Handle case where message is not found within the speech
  if (!message) {
    notFound();
  }

  const speakers = [
    // @ts-ignore - Already handled null speech case
    ...new Set(speech.content.map((item: any) => item.speaker)),
  ].join("、");
  return {
    title: speech.info.name,
    description: `日期：${speech.info.date}\n與會人士：${speakers}`,
    openGraph: {
      images: [
        {
          url: `/api/og/message?data=${encodeURIComponent(
            JSON.stringify({
              title: speech.info.name,
              date: speech.info.date,
              speaker: message.speaker,
              message: message.text,
            }),
          )}`,
        },
      ],
    },
  } as Metadata;
}

export default async function Page({ params }: { params: Params }) {
  const { filename, messageId } = await params;
  const speech = await getSpeech(filename);

  // Handle case where speech is not found
  if (!speech) {
    notFound();
  }

  const name =
    speech.info.name ||
    decodeURIComponent(filename).split(".").slice(0, -1).join(".");
  const date = speech.info.date;

  const message = speech.content.find((item: any) => item.id === messageId);

  // Handle case where message is not found within the speech
  if (!message) {
    notFound();
  }

  return (
    <div className="container my-10">
      <div className="mx-auto mb-2 flex w-[512px] max-w-full items-center justify-between">
        <Link
          href={`/speeches/${filename}#${messageId}`}
          className="flex flex-col items-center gap-1 px-4 text-gray-800 dark:text-white"
        >
          <div className="rounded-full bg-blue-50 p-2 hover:bg-blue-200 active:bg-blue-300 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15">
            <ArrowLeft />
          </div>
          <div className="text-sm opacity-50">返回</div>
        </Link>
        <Share />
      </div>
      <div className="relative mx-auto flex w-[512px] max-w-full overflow-hidden rounded-xl bg-blue-50 shadow-xs dark:bg-[#232323]">
        <div className="grow p-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <Avatar name={message.speaker} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {message.speaker}
              </div>
              <div className="mt-2 text-gray-700 dark:text-white/90">
                {message.text}
              </div>
            </div>
          </div>
          <div className="my-3 h-0.5 w-full rounded-full bg-current opacity-10 max-md:hidden"></div>
          <div className="hidden w-full items-end justify-between text-sm text-gray-500 md:flex dark:text-white/80">
            <div className="flex-1">
              <Link
                href={`/speeches/${filename}#${messageId}`}
                className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-white/80"
              >
                {name}
              </Link>
            </div>
            <div className="text-right">{date}</div>
          </div>
        </div>
        <div className="hidden bg-[#6ECC93] p-5 sm:flex">
          <Quote className="size-8 text-white/50" />
        </div>
      </div>
      <div className="mx-auto mt-2 w-[512px] max-w-full px-4 text-right text-sm text-gray-500 md:hidden dark:text-white/80">
        <Link
          href={`/speeches/${filename}#${messageId}`}
          className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-white/80"
        >
          {name}
        </Link>{" "}
        · {date}
      </div>
    </div>
  );
}
