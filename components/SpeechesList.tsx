import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
export default function SpeechesList({ Speeches }: { Speeches: any[] }) {
  return (
    <div>
      {Speeches.map((speech) => (
        <Link
          href={"/speeches/" + speech.filename}
          key={speech.filename}
          className="flex items-center gap-2 rounded p-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5 dark:active:bg-white/10"
        >
          <DocumentTextIcon className="size-6 shrink-0" />
          <div className="flex flex-wrap">
            <span className="mr-2 tracking-tight text-gray-500 tabular-nums dark:text-gray-300">
              {speech.date}
            </span>
            <span>{speech.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
