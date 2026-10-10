import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Wrap } from '@chakra-ui/react';
import { RotateCcw, Pencil } from 'lucide-react';
import { ApiError } from '../api';

const EDITABLE = new Set(['idea_missing', 'idea_too_short', 'idea_too_long', 'plan_truncated', 'timeout', 'model_timeout']);

const TITLES: Record<string, string> = {
  network: 'Can\'t reach the server',
  busy: 'The drafting table is busy',
  timeout: 'Nimbo took too long',
  model_timeout: 'Nimbo took too long',
  plan_truncated: 'The blueprint came out too long',
  idea_too_short: 'A bit more context, please',
  idea_too_long: 'Your idea is too long',
  model_access: 'Bedrock model access needed',
  model_config: 'Model not available',
};

interface Props {
  error: Error;
  onRetry: () => void;
  onEdit: () => void;
}

export function ErrorNotice({ error, onRetry, onEdit }: Props) {
  const code = error instanceof ApiError ? error.code : 'unknown';
  const canEdit = EDITABLE.has(code);
  const retryable = !['model_access', 'model_config'].includes(code);

  return (
    <Alert status="warning" variant="left-accent" rounded="xl" alignItems="flex-start" role="alert">
      <AlertIcon mt={1} />
      <Box flex={1}>
        <AlertTitle fontFamily="heading">{TITLES[code] ?? 'Something didn\'t go as expected'}</AlertTitle>
        <AlertDescription display="block" mt={1}>{error.message}</AlertDescription>
        <Wrap mt={3} spacing={3}>
          {retryable && (
            <Button size={{ base: 'md', md: 'sm' }} onClick={onRetry} leftIcon={<RotateCcw size={14} />} bg="ink" color="white" _hover={{ bg: 'blueprint' }}>
              Retry
            </Button>
          )}
          {canEdit && (
            <Button size={{ base: 'md', md: 'sm' }} variant="outline" onClick={onEdit} leftIcon={<Pencil size={14} />}>
              Edit my idea
            </Button>
          )}
        </Wrap>
      </Box>
    </Alert>
  );
}
