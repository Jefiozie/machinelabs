import { animate, trigger, transition, query, style, stagger } from '@angular/animations';
import { DataSource } from '@angular/cdk/collections';
import { Location } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, mergeMap, scan, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OutputFile } from '../../models/output-file';
import { OutputFilesService } from '../../output-files.service';
import { SnackbarService } from '../../snackbar.service';
import { LocationHelper } from '../../util/location-helper';
import { isImage } from '../../util/output';
import { FilePreviewDialogService } from '../file-preview/file-preview-dialog.service';

export class OutputFilesDataSource extends DataSource<any> {
  constructor(private outputFilesService: OutputFilesService, private executionId: string) {
    super();
  }

  connect(): Observable<OutputFile[]> {
    return this.outputFilesService
      .observeOutputFilesFromExecution(this.executionId)
      .pipe(scan((acc: OutputFile[], val: OutputFile) => [val, ...acc], []));
  }

  disconnect() {}
}
@Component({
  selector: 'ml-file-outputs',
  templateUrl: './file-outputs.component.html',
  styleUrls: ['./file-outputs.component.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* <=> *', [
        query('mat-row', style({ opacity: 0 }), { optional: true }),
        query(
          'mat-row',
          stagger(100, [style({ opacity: 0 }), animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1 }))]),
          { optional: true }
        )
      ])
    ])
  ]
})
export class FileOutputsComponent implements OnChanges, OnInit {
  @Input() executionId: string;

  displayedColumns = ['name', 'created', 'size', 'contentType', 'actions'];

  dataSource: OutputFilesDataSource;

  hasOutput: Observable<boolean>;

  isImage = isImage;
  data: OutputFile[];
  showTable: boolean;

  constructor(
    public outputFilesService: OutputFilesService,
    private snackbarService: SnackbarService,
    private filePreviewService: FilePreviewDialogService,
    private route: ActivatedRoute,
    private locationHelper: LocationHelper,
    private location: Location
  ) {}

  ngOnInit() {
    const outputFileId = this.route.snapshot.queryParamMap.get('preview');

    if (outputFileId) {
      this.hasOutput
        .pipe(
          filter(hasOutput => hasOutput),
          mergeMap(() => this.dataSource.connect()),
          mergeMap(outputFiles => outputFiles),
          filter(outputFile => outputFile.id === outputFileId),
          filter(outputFile => isImage(outputFile.name)),
          take(1)
        )
        .subscribe(outputFile => this.openPreview(outputFile));
    }
  }

  ngOnChanges() {
    this.showTable = false;

    // jsut a copy of the datasource connect function.
    this.outputFilesService
      .observeOutputFilesFromExecution(this.executionId)
      .pipe(scan((acc: OutputFile[], val: OutputFile) => [val, ...acc], []))
      .subscribe(data => {
        //set the data to a local prop.
        this.data = data;
        // show the table when we have data.
        this.showTable = true;
      });
  }

  openPreview(outputFile: OutputFile) {
    this.locationHelper.updateQueryParams(this.location.path(), {
      preview: outputFile.id
    });
    this.filePreviewService
      .open({
        data: {
          outputFile
        }
      })
      .beforeClose()
      .subscribe(() => {
        this.locationHelper.removeQueryParams(this.location.path(), 'preview');
      });
  }

  getApiLink(outputFile: OutputFile) {
    return `${environment.restApiURL}/executions/${outputFile.execution_id}/outputs/${outputFile.name}`;
  }

  copyDone(error = false) {
    const message = error ? 'Could not copy link' : 'Link copied';
    this.snackbarService.notify(message);
  }
}
