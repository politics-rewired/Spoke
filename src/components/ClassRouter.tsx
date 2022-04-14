import { Constructor, parseURLData } from 'web-utility';
import { Location } from 'history';
import React, { Component, PureComponent } from 'react';
import { useLocation, useParams } from 'react-router-dom';

// Types come from https://cdn.jsdelivr.net/npm/@types/react-router/index.d.ts

export interface StaticContext {
    statusCode?: number | undefined;
}

export interface match<
    Params extends Partial<Record<keyof Params, string>> = {}
> {
    url: string;
    path: string;
    params: Params;
}

export interface RouteComponentProps<
    Params extends Partial<Record<keyof Params, string>> = {},
    Context extends StaticContext = StaticContext,
    Query extends Record<string, any> = {}
> {
    location: Location;
    match: match<Params>;
    query: Query;
    staticContext?: Context;
}

/**
 * @see https://v5.reactrouter.com/web/api/withRouter
 */
export function withRouter(
    Class: Constructor<
        Component<RouteComponentProps> | PureComponent<RouteComponentProps>
    >
) {
    return () => {
        const location = useLocation(),
            params = useParams();

        const { pathname = '/', search = '', hash = '' } = location;

        const path = pathname + search + hash;

        const match = {
                url: globalThis.location.origin + path,
                path,
                params
            },
            query = parseURLData(search);

        return <Class {...{ location, match, query }} />;
    };
}
