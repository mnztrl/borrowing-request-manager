export interface Media {
    'article_title': string,
    'author': string,
    'book_title': string,
    'chapter_author': string,
    'chapter_title': string,
    'doi': string,
    'edition': string,
    'isbn': string,
    'issn': string,
    'issue': string,
    'journal_title': string,
    'pages': string,
    'place_of_publication': string,
    'pmid': string,
    'type': string,
    'volume': string,
    'year': string,
}

export class MediaUtils {
    apiResult : any;
    media: Media;
    constructor(apiResult) {
        this.apiResult = apiResult;
    }

    getMedia() : Media {
        this.media = {
            'article_title': this.apiResult?.title,
            'author': this.apiResult?.author,
            'book_title': this.apiResult?.title,
            'chapter_author': this.apiResult?.chapter_author,
            'chapter_title': this.apiResult?.chapter_title,
            'doi': this.apiResult?.doi,
            'edition': this.apiResult?.edition,
            'isbn': this.apiResult?.isbn,
            'issn': this.apiResult?.issn,
            'issue': this.apiResult?.issue,
            'journal_title': this.apiResult?.journal_title,
            'pages': this.apiResult?.pages,
            'place_of_publication': this.apiResult?.place_of_publication,
            'pmid': this.apiResult?.pmid,
            'type': this.getMediaType(),
            'volume': this.apiResult?.volume,
            'year': this.apiResult?.year,
        }

        return this.media;
    }

    getMediaType() : string {
        let mediaType = 'chapter';
        if (this.apiResult?.citation_type?.desc === 'Physical Article') {
            mediaType = 'article';
        }

        return mediaType;
    }
}
