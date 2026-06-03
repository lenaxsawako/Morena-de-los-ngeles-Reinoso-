interface ReaderProps {
  title: string;
  content: string;
}

export default function Reader({
  title,
  content,
}: ReaderProps) {
  return (
    <article
      className="
        mx-auto
        max-w-3xl
        px-6
        py-10
      "
    >
      <h1
        className="
          mb-8
          text-4xl
          font-bold
        "
      >
        {title}
      </h1>

      <div
        className="
          whitespace-pre-wrap
          text-lg
          leading-9
          text-gray-800
        "
      >
        {content}
      </div>
    </article>
  );
}