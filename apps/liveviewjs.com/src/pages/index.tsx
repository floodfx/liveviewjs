import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title font-brand "><span className="font-semibold">LiveView</span><span className="font-thin">JS</span></h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="mt-4 button button--secondary button--lg"
            to="/docs/category/quick-starts">
             Quick Start &rarr;
          </Link>
        </div>
      </div>
      
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <section className="bg-brand py-8">
          <div className="flex justify-center">
            <Link
              className="button button--secondary button--lg"
              to="/docs/category/overview">
              Learn More &rarr;
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
