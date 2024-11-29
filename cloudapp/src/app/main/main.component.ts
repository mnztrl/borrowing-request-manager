import { Observable, Subscription } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  CloudAppRestService, CloudAppEventsService, Entity, AlertService, PageInfo, CloudAppConfigService
} from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';
import {Configuration} from "../../models/configuration";
import { Media, MediaUtils } from './media-utils';
import { User, UserUtils } from './user-utils';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
    userUtils: UserUtils;
    mediaUtils: MediaUtils;

    entityType = '';
    loading = false;
    selectedEntity: Entity;
    config: any;
    private pageLoad$: Subscription;

    entities$: Observable<Entity[]> = this.eventsService.entities$
    .pipe(tap(() => this.clear()));

    constructor(
        private restService: CloudAppRestService,
        private eventsService: CloudAppEventsService,
        private configService: CloudAppConfigService,
        private alert: AlertService
    ){}

    ngOnInit() {
        this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
        this.configService.get().subscribe(config => {
            this.config = config as Configuration;
        });
    }

    ngOnDestroy(): void {}

    onPageLoad = (pageInfo: PageInfo) => {
        if (typeof pageInfo.entities === 'object' && pageInfo.entities.length >= 1 &&
            typeof pageInfo.entities[0] === 'object' && pageInfo.entities[0].hasOwnProperty('type')
        ) {
            this.entityType = pageInfo.entities[0].type;
        }
        else {
            this.entityType = '';
        }
    }

    entitySelected(event: MatRadioChange){
        const value = event.value as Entity;
        this.loading = true;
        this.restService.call<any>(value.link)
            .pipe(
                switchMap(result => {
                    this.mediaUtils = new MediaUtils(result);
                    return this.restService.call<any>(result.requester.link);
                }),
                finalize(() => this.loading = false)
            )
            .subscribe(apiResultUser => {
                this.userUtils = new UserUtils(apiResultUser);
            }, error => this.alert.error('Failed to retrieve entity: ' + error.message)
          );
    }

    getIllFormLink() : string {
        let baseURL : string = this.config?.illFormBaseUrl;
        let queryString : string = this.getQueryString();

        return `${baseURL}/?${queryString}`;
    }

    getQueryString() : string {
        let user: User = this.userUtils.getUser();
        let media: Media = this.mediaUtils.getMedia();

        let illFormQueryString : string = this.config?.illFormQueryString;
        // Make sure there are no whitespaces in the query string.
        illFormQueryString = illFormQueryString.replace(/\s/g, '');

        let validQueryStringParams: object = {
            // Media data
            'article_title': media.article_title,
            'author': media.author,
            'book_title': media.book_title,
            'chapter_author': media.chapter_author,
            'chapter_title': media.chapter_title,
            'doi': media.doi,
            'edition': media.edition,
            'isbn': media.isbn,
            'issn': media.issn,
            'journal_title': media.journal_title,
            'media_type': media.type,
            'issue': media.issue,
            'pages': media.pages,
            'pmid': media.pmid,
            'volume': media.volume,
            'year': media.year,

            // User data
            'address': user.address.address,
            'city': user.address.city,
            'city_code': user.address.city_code,
            'clinic': user.address.organization,
            'email': user.email,
            'name': user.name,
            'organization': user.address.organization,
            'phone': user.phone,
            'primary_id': user.primary_id,
            'umuid': user.id,
            'user_type': user.type
        }

        for (let i in validQueryStringParams) {
            if (illFormQueryString.includes('{'+i+'}')) {
                let patternToReplace = new RegExp('\{'+i+'\}', 'g');

                illFormQueryString = illFormQueryString
                    .replace(patternToReplace, encodeURIComponent(validQueryStringParams[i]));
            }
        }

        return illFormQueryString;
    }

    getIllFormButtonLabel() : string {
        return this.config?.illFormButtonLabel ?? 'Send to external ILL form';
    }

    clear() {
        this.userUtils = null;
        this.mediaUtils = null;
        this.selectedEntity = null;
    }
}