import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, filter, tap, delay } from 'rxjs/operators';
import { BackendService } from '../backend/backend.service';

interface Advertiser {
    campaigns: any;
    budget: number;
    spend: number;
    id: number;
    name: string;
    advertiserName: string;
}

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html'
})


export class TimelineComponent implements OnInit {
    static FULLTIMELINE;
    @ViewChild('moviename') seachInput: ElementRef;
    private url: any;
    private _advertiserArr;
    private _timeArr;
    private isAutoComp: boolean;
    private isLoading: boolean;
    private searchFilterArr;
    dataListArr: Array<string>;
    timelineArray: Array<any>;
    p = 1;
    activeSort = '';

    constructor(private bkSvc: BackendService) {
        this.url = 'http://hck.re/qmPuPD';
        this.timelineArray = [];
        this._advertiserArr = [];
        this.isAutoComp = false;
        this.isLoading = true;
        this.dataListArr = [];
        this.searchFilterArr = [];
        this._timeArr = [{ text: '', option: '' },
        { text: 'Today', option: 't' },
        { text: 'Last 7 days', option: 'l7d' },
        { text: 'Last month', option: 'lm' },
        { text: 'Last quarter', option: 'lq' },
        { text: 'Last year', option: 'ly' }
        ];
    }

    ngOnInit() {
        this.bkSvc.getData(this.url)
            .pipe(delay(2000))
            .subscribe((data: any) => {
                TimelineComponent.FULLTIMELINE = (!!data && data.length > 0) ? data : null;
                TimelineComponent.FULLTIMELINE.forEach((m: Advertiser) => {
                    if ((this._advertiserArr.indexOf(m.advertiserName) < 0) && m.advertiserName.trim() !== '') {
                        this._advertiserArr.push(m.advertiserName);
                    }
                });
                this._advertiserArr.sort();
                console.log(this._advertiserArr);
                this.timelineArray = TimelineComponent.FULLTIMELINE;
                this.isLoading = false;
            },
                (error: any) => {
                    console.error(error);
                });

        const keyword = fromEvent(this.seachInput.nativeElement, 'input')
            .pipe(
                map((e: KeyboardEvent) => e.target['value']),
                tap(text => this.isAutoComp = (text.length < 3) ? false : true),
                filter(text => text.length > 2),
                debounceTime(1000)
            )
            .subscribe(val => {
                this.isAutoComp = true;
                this.typeAhead(val.trim().toLowerCase());
            });
    }

    filter(param) {
        if (param === '') {
            this.timelineArray = (this.searchFilterArr.length > 0) ? JSON.parse(JSON.stringify(this.searchFilterArr)) :
            JSON.parse(JSON.stringify(TimelineComponent.FULLTIMELINE));
            return;
        }
        this.isLoading = true;
        this.timelineArray = (this.searchFilterArr.length > 0) ? JSON.parse(JSON.stringify(this.searchFilterArr)) :
            JSON.parse(JSON.stringify(TimelineComponent.FULLTIMELINE));

        this.timelineArray.map((e: Advertiser) => {
            const camp = JSON.parse(JSON.stringify(e.campaigns));
            e.campaigns.forEach((val, i) => {
                const dateArr = val['start_date'].split('-');
                const start_date = dateArr[2] + '-' + dateArr[1] + '-' + dateArr[0];
                if (!this.getDays(param, start_date)) {
                    const index = camp.findIndex((e: any) => e['start_date'] === val['start_date']);
                    camp.splice(index, 1);
                }
            });
            e.campaigns = camp;
        });
        this.isLoading = false;
    }

    sorting(e: any, name) {
        const param = e.target.innerHTML;
        e.target.innerHTML = (param === '↑') ? '↓' : '↑';
        this.timelineArray = this.timelineArray.sort((a, b) => {
        this.activeSort = name;

            if (name === 'brand') {
                return (param === '↓') ? (a.name.charCodeAt(0) - b.name.charCodeAt(0)) : (b.name.charCodeAt(0) - a.name.charCodeAt(0));
            }
            if (name === 'fname') {
                const code_a = (!!a.campaigns[0]) ? a.campaigns[0].name.charCodeAt(0) : 100;
                const code_b = (!!b.campaigns[0]) ? b.campaigns[0].name.charCodeAt(0) : 100;
                return (param === '↓') ? (code_a - code_b) : (code_b - code_a);
            }
            if (name === 'count') {
                return (param === '↓') ? (a.campaigns.length - b.campaigns.length) : (b.campaigns.length - a.campaigns.length);
            }
        });
    }

    search(advertiser) {
        this.isLoading = true;
        advertiser = advertiser.value;
        if (advertiser.trim() === '') {
            this.isLoading = false;
            return;
        }
        this.timelineArray = [];
        (<any>document.querySelector('#filterTimeline')).options[0].selected = 'selected';

        this.bkSvc.getData(this.url)
            .pipe(delay(2000))
            .subscribe((data: any) => {
                TimelineComponent.FULLTIMELINE = (!!data && data.length > 0) ? data : null;

                this.timelineArray = TimelineComponent.FULLTIMELINE.filter((m: Advertiser) => {
                    return (m.advertiserName.trim().toLowerCase() === advertiser.trim().toLowerCase());
                });
                this.timelineArray = this.timelineArray.sort((a, b) => {
                    return (b.budget - a.budget);
                });
                this.isLoading = false;
                this.searchFilterArr = JSON.parse(JSON.stringify(this.timelineArray));
            });
    }

    reset() {
        this.searchFilterArr = [];
        this.timelineArray = JSON.parse(JSON.stringify(TimelineComponent.FULLTIMELINE));
        this.seachInput.nativeElement.value = '';
        (<any>document.querySelector('#filterTimeline')).options[0].selected = 'selected';
        this.dataListArr = [];
        return;
    }

    theme(e) {
        if (e.target.checked) {
            (<any>document.querySelector('.main')).style.background = 'rgba(95, 184, 152, 0.95)';
            (<any>document.querySelector('.header')).style.background = '#000000db';
            (<any>document.querySelector('.header')).style.color = '#fff';
            (<any>document.querySelector('.filter')).style.background = '#b14848';
        } else {
            (<any>document.querySelector('.main')).style.background = 'none';
            (<any>document.querySelector('.header')).style.background = '#0e0e0e52';
            (<any>document.querySelector('.header')).style.color = '#000';
            (<any>document.querySelector('.filter')).style.background = '#e9ecef';
        }
    }

    private typeAhead(text: any) {
        const tempArr = [];
        this._advertiserArr.forEach((m: string) => {
            if ((m.toLowerCase().indexOf(text)) > -1) {
                tempArr.push({ name: m, index: m.toLowerCase().indexOf(text) });
            }
        });

        tempArr.sort((a: any, b: any) => {
            return (a.index - b.index);
        });
        tempArr.forEach((a: any, b: any) => {
            return (a.index - b.index);
        });

        this.dataListArr = (tempArr.length > 0) ? [] : this.dataListArr;
        for (const item of tempArr) {
            this.dataListArr.push(item.name);
            if (this.dataListArr.length === 10) {
                break;
            }
        }
    }

    //YYYY-mm-dd
    private getDays(param, date) {
        const today = Date.parse(new Date().toISOString().slice(0, 10)) / 1000 / 60 / 60 / 24;
        const compareDate = Date.parse(date) / 1000 / 60 / 60 / 24;
        switch (param) {
            case 't':
                return today === compareDate;
            case 'l7d':
                return ((today - compareDate <= 7) && (today > compareDate)) ? true : false;
            case 'lq':
                return ((today - compareDate <= 90) && (today > compareDate)) ? true : false;
            case 'lm':
                return ((today - compareDate <= 30) && (today > compareDate)) ? true : false;
            case 'ly':
                return ((today - compareDate <= 365) && (today > compareDate)) ? true : false;
        }
    }
}

