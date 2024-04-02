import '../../index.css';
import { ClientOnly } from './client';

export function generateStaticParams() {
  return [{ slug: [''] }, { login: [''] }];
}

export default function Page() {
  return <ClientOnly />;
}
