interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div>
      <div className="p-4 bg-red-300 w-full">
        this is a navbar
      </div>
      { children }
    </div>
  )
}

export default Layout;