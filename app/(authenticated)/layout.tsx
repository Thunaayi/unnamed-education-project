import Topbar from '../components/topbar'
import Sidebar from '../components/sidebar'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <div className="layout-body">
        <Sidebar />
        <div className="content-slot">{children}</div>
      </div>
    </>
  )
}
