import { Component, OnInit, Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    CloudAppConfigService,
    CloudAppEventsService,
    CloudAppRestService,
    AlertService
} from '@exlibris/exl-cloudapp-angular-lib';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ErrorMessages } from '../static/error.component';
import { Configuration } from "../../models/configuration";

@Component({
    selector: 'app-configuration',
    templateUrl: './configuration.component.html',
    styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
    form: FormGroup;
    saving = false;

    constructor(
        private appService: AppService,
        private fb: FormBuilder,
        private configService: CloudAppConfigService,
        private alert: AlertService
    ) {}

    ngOnInit(): void {
        this.appService.setTitle('Configuration');
        this.form = this.fb.group({
            illFormBaseUrl: this.fb.control('',[
                Validators.pattern('(https?:\\/\\/)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,6}(:\\d{1,5})?(\\/[^\\s]*)?'),
                Validators.required
            ]),
            illFormQueryString: this.fb.control('', [
                Validators.pattern('([\\w\\.]+)\\=(\\{\\w+\\}|\\w+)(&([\\w\\.]+)\\=(\\{\\w+\\}|\\w+))*'),
                Validators.required
            ]),
            illFormButtonLabel: this.fb.control('',[
                Validators.required
            ]),
        });

        this.load();
    }

    get illFormBaseUrl() {
        return this.form.get('illFormBaseUrl');
    }

    get illFormQueryString() {
        return this.form.get('illFormQueryString');
    }

    get illFormButtonLabel() {
        return this.form.get('illFormButtonLabel');
    }

    load() {
        this.configService.getAsFormGroup().subscribe(config => {
            if (Object.keys(config.value).length != 0) {
                this.form = config;
            }
        });
    }

    save() {
        this.saving = true;
        this.configService.set(this.form.value).subscribe(
            () => {
                this.alert.success('Configuration successfully saved.');
                this.form.markAsPristine();
            },
            err => this.alert.error(err.message),
            ()  => this.saving = false
        );
    }
}

@Injectable({
    providedIn: 'root',
})
export class ConfigurationGuard implements CanActivate {
    constructor (
        private eventsService: CloudAppEventsService,
        private restService: CloudAppRestService,
        private router: Router
    ) {}

    canActivate(): Observable<boolean> {
        return this.eventsService.getInitData().pipe(
            switchMap( initData => this.restService.call(`/users/${initData.user.primaryId}`)),
            map(user => {
                if (!user.user_role.some(role => role.role_type.value == '51')) {
                    this.router.navigate(['/error'],
                        { queryParams: { error: ErrorMessages.NO_ACCESS } });
                    return false;
                }
                return true;
            })
        );
    }
}
