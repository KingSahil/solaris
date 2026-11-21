import { useQuery } from '@tanstack/react-query';
import { SolarPanel } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { fetchInstallations, installationPageKey, INSTALLATIONS_PAGE_SIZE } from '../api/staffData';
import { PageHead } from '../components/PageHead';
import { Pager } from '../components/Pager';
import { formatMoment } from '../lib/dates';
import { pageFrom } from '../lib/paging';
import { useCurrentUser } from '../session/session';
import { opensFor } from '../shell/sections';
import { Empty, NotAllowed } from '../states/States';
import { QueryView } from '../states/QueryView';

export function InstallationsPage() {
  const me = useCurrentUser();
  const [params] = useSearchParams();
  const page = pageFrom(params.get('page'));
  const query = useQuery({ queryKey: installationPageKey(page), queryFn: ({ signal }) => fetchInstallations(page, signal), enabled: me.role === 'Admin' });
  if (!opensFor(me.role, '/installations')) return <NotAllowed />;
  return <>
    <PageHead title="Installations" />
    <p className="page-intro">Solar projects, their current stage, and the property time zone.</p>
    <QueryView query={query} what="the installations" isEmpty={data => data.totalCount === 0} empty={<Empty icon={SolarPanel} title="No installations yet">Projects appear here when a quote request is converted.</Empty>}>
      {data => <>
        <div className="table-wrap directory-table"><table className="table">
          <caption className="sr">Installations, newest first</caption>
          <thead><tr><th scope="col">Customer</th><th scope="col">Location</th><th scope="col">Stage</th><th scope="col">Time zone</th><th scope="col" className="r">Created</th></tr></thead>
          <tbody>{data.items.map(x => <tr key={x.id}><td><strong>{x.customerName}</strong></td><td>{x.location}</td><td><span className={`record-status record-status-${x.status.toLowerCase()}`}>{x.status}</span></td><td>{x.timeZone}</td><td className="num r">{formatMoment(x.createdAt)}</td></tr>)}</tbody>
        </table></div>
        <Pager label="Pages of installations" page={page} pageSize={INSTALLATIONS_PAGE_SIZE} totalCount={data.totalCount} hrefFor={p => `/installations?page=${p}`} />
      </>}
    </QueryView>
  </>;
}
