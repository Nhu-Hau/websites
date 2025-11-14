export type SubItemType = {
  label: string;
  href: string;
};

export type NavItemType = {
  label: string;
  href?: string;
  children?: SubItemType[];
};