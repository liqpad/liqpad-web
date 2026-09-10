import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/constants';

export default function sitemap():MetadataRoute.Sitemap{return ['','/launch','/transparency','/docs','/me'].map(path=>({url:`${SITE_URL}${path}`,lastModified:new Date()}))}
