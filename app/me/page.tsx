import type {Metadata} from 'next';
import {getLaunches} from '@/lib/data';
import {MeView} from '@/components/me-view';
import {pageMetadata} from '@/lib/seo';

export const dynamic='force-dynamic';
export const metadata:Metadata=pageMetadata({title:'My Creator Dashboard',description:'Manage launches and creator fee claims for the connected wallet.',path:'/me',index:false});
export default async function Page(){return <MeView launches={await getLaunches()}/>}
