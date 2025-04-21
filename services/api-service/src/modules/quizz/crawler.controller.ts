import { Controller, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) { }

  @Get('manual')
  async manualTrigger() {
    await this.crawlerService.crawlAllCategories();
    return { message: '✅ Crawling completed manually' };
  }
}