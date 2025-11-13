import Link from "next/link";

type Crumb = { href?: string; label: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center text-base text-gray-600 dark:text-gray-300"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {item.href ? (
            <Link
              href={item.href}
              className=" hover:text-sky-600 dark:hover:text-sky-400 hover:no-underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold">{item.label}</span>
          )}
          {i < items.length - 1 && (
            <span className="mx-2 text-gray-400" aria-hidden>
              /
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
