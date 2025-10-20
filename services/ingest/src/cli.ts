#!/usr/bin/env node
import yargs, { type Argv, type ArgumentsCamelCase } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { logger } from './logger';
import { listScrapers } from './scrapers/registry';
import { initializeScrapers } from './scrapers';
import { enqueueIngestionJob } from './jobs';
import { runIngestionJob } from './runner';
import { startScheduler } from './scheduler';

function parseOptionPairs(option?: string[]): Record<string, string> {
  if (!option) return {};
  return Object.fromEntries(
    option.map((entry) => {
      const [key, ...rest] = entry.split('=');
      return [key, rest.join('=')];
    }),
  );
}

async function main() {
  initializeScrapers();

  const parser = yargs(hideBin(process.argv))
    .scriptName('smartbundle-ingest')
    .command(
      'run [source]',
      'Run an ingestion job immediately',
      (y: Argv) =>
        y
          .positional('source', {
            type: 'string',
            demandOption: true,
            description: 'Source key registered in the scraper registry',
          })
          .option('option', {
            alias: 'o',
            type: 'array',
            string: true,
            description: 'Override options in key=value form',
          }),
      async (args: ArgumentsCamelCase<{ source: string; option?: string[] }>) => {
        const { source, option } = args;
        const options = parseOptionPairs(option);
        const result = await runIngestionJob({ source, options });
        logger.info(result, 'Completed ingestion run');
      },
    )
    .command(
      'enqueue [source]',
      'Queue an ingestion job for background processing',
      (y: Argv) =>
        y
          .positional('source', {
            type: 'string',
            demandOption: true,
            description: 'Source key registered in the scraper registry',
          })
          .option('option', {
            alias: 'o',
            type: 'array',
            string: true,
            description: 'Override options in key=value form',
          }),
      async (args: ArgumentsCamelCase<{ source: string; option?: string[] }>) => {
        const { source, option } = args;
        const options = parseOptionPairs(option);
        const job = await enqueueIngestionJob({ source, options });
        logger.info({ jobId: job.id, source }, 'Enqueued ingestion job');
      },
    )
    .command(
      'list',
      'List registered scrapers',
      (y: Argv) => y,
      () => {
        const scrapers = listScrapers();
        if (!scrapers.length) {
          logger.warn('No scrapers registered yet.');
        } else {
          scrapers.forEach((name) => logger.info({ name }, 'Registered scraper'));
        }
      },
    )
    .command(
      'schedule',
      'Start the cron-based scheduler using config/sources.yml',
      (y: Argv) =>
        y.option('config', {
          type: 'string',
          description: 'Path to sources configuration YAML file',
        }),
      async (args: ArgumentsCamelCase<{ config?: string }>) => {
        if (args.config) {
          process.env.SOURCES_CONFIG = args.config;
        }
        await startScheduler();
      },
    )
    .demandCommand()
    .strict()
    .help();

  await parser.parseAsync();
}

main().catch((error) => {
  logger.error({ err: error }, 'CLI execution failed');
  process.exitCode = 1;
});
