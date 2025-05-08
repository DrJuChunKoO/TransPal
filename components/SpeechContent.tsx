import Avatar from "@/components/Avatar";
import MessageText from "@/components/MessageText";
import Markdown from "@/components/Markdown";
import { twMerge } from "tailwind-merge";
export default function SpeechContent({
  content,
  keywords = [],
  filename,
}: {
  content: {
    id: string;
    speaker: string;
    text: string;
    type: string;
  }[];
  keywords?: string[];
  filename: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {content.map((item: any, index: number) => {
        if (item.type === "divider")
          return (
            <div
              key={item.id}
              className="ml-14 flex items-center justify-between gap-4"
            >
              {item.text ? (
                <>
                  <div className="h-1 w-full bg-gray-50 dark:bg-gray-100/10"></div>
                  <div className="shrink-0 opacity-50">{item.text}</div>
                  <div className="h-1 w-full bg-gray-50 dark:bg-gray-100/10"></div>
                </>
              ) : (
                <div className="h-1 w-full bg-gray-50 dark:bg-gray-100/10"></div>
              )}
            </div>
          );
        if (item.type === "markdown")
          return (
            <div
              key={item.id}
              className={twMerge(
                "ml-14",
                // for markdown
                "prose prose-sm dark:prose-invert my-6 w-full break-all",
              )}
            >
              <Markdown>{item.text}</Markdown>
            </div>
          );

        const text = (
          <MessageText
            item={item}
            keywords={keywords}
            filename={filename}
            key={item.id}
          />
        );
        const avatar = (
          <div
            className="-mb-6 flex items-start justify-start gap-2"
            key={`avatar-${index}`}
          >
            <Avatar name={item.speaker} />
            <div>
              <div className="font-bold text-gray-800 dark:text-gray-200">
                {item.speaker}
              </div>
            </div>
          </div>
        );
        return content[index - 1]?.speaker !== item.speaker ? (
          <div key={item.id}>
            {avatar}
            {text}
          </div>
        ) : (
          text
        );
      })}
    </div>
  );
}
