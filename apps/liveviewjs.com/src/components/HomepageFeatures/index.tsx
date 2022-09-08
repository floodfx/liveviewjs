import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Simple, powerful, scalable paradigm',
    Svg: require('@site/static/img/features/simple.svg').default,
    description: (
      <>
        Create "single page app" user experiences with the ease of server-rendered HTML.
      </>
    ),
  },
  {
    title: 'Native Real-time & multi-player support',
    Svg: require('@site/static/img/features/multiplayer.svg').default,
    description: (
      <>
        Easily update the UI of any or all connected users with built-in support for Pub/Sub. 
      </>
    ),
  },
  {
    title: 'No boilerplate & no reinventing the wheel',
    Svg: require('@site/static/img/features/nirvana.svg').default,
    description: (
      <>
        No "client-side routing" or "state management";
        no REST or GraphQL APIs; No BS, just GSD-nirvana.
      </>
    ),
  },
  
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className='grid grid-cols-1 justify-center'>
        <div className='flex justify-center'>
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <h3 className='text-center text-2xl font-brand text-brand'>{title}</h3>
        <div  className='flex justify-center'>
          <p className="text-center mt-4 md:w-full w-3/4">{description}</p>      
        </div> 
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 justify-center gap-y-10 md:gap-x-12">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
