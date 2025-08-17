"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home,  Menu, ChevronLeft, LogOut,  Book, FileText, Layers, Search } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";


interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  href: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const SidebarItem = ({
  icon,
  label,
  active,
  expanded,
  href,
  onClick,
}: SidebarItemProps) => {
  const content = (
    <Link href={href} className="block" onClick={onClick}>
      <div
        className={`flex items-center ${
          expanded ? "justify-start" : "justify-center"
        } px-4 py-3 gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-all ${
          active ? "bg-slate-200 dark:bg-slate-800" : ""
        }`}
      >
        <div>{icon}</div>
        {expanded && <span className="whitespace-nowrap">{label}</span>}
      </div>
    </Link>
  );

  return expanded ? (
    content
  ) : (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Componente de conteúdo da Sidebar que é compartilhado entre a versão desktop e móvel
interface SidebarContentProps {
  expanded: boolean;
  closeMobileMenu?: () => void;
  loading: boolean;
}

const SidebarContent = ({
  expanded,
  closeMobileMenu = () => {},
}: SidebarContentProps) => {
  const pathname = usePathname();


  const menuItems = [
    {
      id: "domain",
      label: "Domains",
      icon: <Home size={20} />,
      href: "/client/domain",
    },
    {
      id: "book",
      label: "Add Book",
      icon: <Book size={20} />,
      href: "/client/book/create",
    },
    {
      id: "article",
      label: "Add Article",
      icon: <FileText size={20} />,
      href: "/client/article/create",
    },
    {
      id: "context",
      label: "Add Context",
      icon: <Layers size={20} />,
      href: "/client/context/create",
    },
    {
      id: "search",
      label: "Search",
      icon: <Search size={20} />,
      href: "/client/search",
    },
  ];

  // Verifica se a rota atual corresponde ao item do menu
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/client`);
  };


  return (
    <>
      <div
        className={`flex ${
          expanded ? "justify-start px-4" : "justify-center"
        } py-6`}
      >
        <div className="flex flex-col items-center gap-2 w-full">
         
            <>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {"Goldcare".charAt(0)}
              </div>
              {expanded && (
                <>
                  <div className="font-medium mt-2">
                    {"Goldacare"}
                  </div>
                </>
              )}
            </>
         
        </div>
      </div>

      <div className="mt-6 px-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
            expanded={expanded}
            href={item.href}
            onClick={closeMobileMenu}
          />
        ))}
      </div>

      <div className="mt-auto border-t p-4">
        <SidebarItem
          icon={<LogOut size={20} />}
          label="Sair"
          expanded={expanded}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            closeMobileMenu();
          }}
        />
      </div>
    </>
  );
};

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);



  // Detectar se está em dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Versão Mobile (Sheet/Drawer) do Sidebar
  const MobileSidebar = () => (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu Escondido</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-64px)] flex flex-col">
          <SidebarContent
            expanded={true}
            closeMobileMenu={() => setMobileOpen(false)}
            loading={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  // Versão Desktop do Sidebar
  const DesktopSidebar = () => (
    <div
      className={`${
        expanded ? "w-64" : "w-20"
      } fixed top-0 left-0 h-screen bg-white dark:bg-slate-950 border-r transition-all duration-300 flex flex-col z-30`}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {expanded && (
          <div className="font-semibold text-lg">
            <span className="text-green-800">Gold. </span>
            <span className="text-blue-800">Care</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className={expanded ? "" : "mx-auto"}
        >
          {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      <SidebarContent expanded={expanded}  loading={loading} />
    </div>
  );

  return (
    <>
      {/* Sidebar para Mobile */}
      <div className="block md:hidden">
        <MobileSidebar />
      </div>

      {/* Sidebar para Desktop */}
      <div className="hidden md:block">
        <DesktopSidebar />
        <div
          className={`${
            expanded ? "w-64" : "w-20"
          } transition-all duration-300`}
        ></div>
      </div>
    </>
  );
}
