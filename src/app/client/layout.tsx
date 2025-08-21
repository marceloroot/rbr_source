

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full ">

      <main className="flex-1 overflow-auto p-5 lg:p-6">{children}</main>
    </div>
  );
}
