// @deno-types="npm:@primer/octicons-react@19.11.0"
import { MarkGithubIcon } from "https://esm.sh/@primer/octicons-react@19.11.0?external=react&no-dts";

export function SiteHeader() {
  const dirs = pageDirectory.replace(/^\.\.?\/*|\/+$/g, "").split("/").filter(
    (x) => x
  );

  return (
    <header className="px-6 py-4 shadow-[0px_0px_1rem_rgba(0,0,0,0.1)] flex justify-between sticky top-0 bg-[#fffe] backdrop-filter[blur(0.5rem)] z-10">
      <div className="flex gap-2">
        <a href={projectRoot} className="no-decoration font-bold">Dejamu</a>
        {dirs.map((dir) => (
          <>
            <span>/</span>
            <a
              href={projectRoot + "/" + dir}
              className="no-decoration font-bold opacity-50"
            >
              {dir}
            </a>
          </>
        ))}
      </div>
      <a
        x-key="_"
        className="no-decoration"
        aria-label="github repository"
        href="https://github.com/ikasoba/dejamu"
      >
        <MarkGithubIcon
          className="transition-transform hover:scale-125 active:scale-100"
          size={24}
        />
      </a>
    </header>
  );
}
