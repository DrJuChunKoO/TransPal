import SpeechesList from "@/components/SpeechesList";
import { getSpeeches } from "@/utils/speeches";

export default async function Page() {
  const speeches = await getSpeeches();
  return (
    <div className="container my-2">
      <SpeechesList Speeches={speeches} />
    </div>
  );
}
