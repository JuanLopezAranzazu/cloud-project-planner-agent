import { Flex, HStack, Text, Icon } from '@chakra-ui/react';
import { CloudCog } from 'lucide-react';

export function Header() {
  return (
    <Flex as="header" align="center" justify="space-between" py={{ base: 4, md: 5 }}>
      <HStack spacing={3}>
        <Flex boxSize={10} bg="ink" color="marker" rounded="xl" align="center" justify="center" aria-hidden>
          <Icon as={CloudCog} boxSize={5} />
        </Flex>
        <Text fontFamily="heading" fontWeight={700} fontSize="lg">
          Nimbo
        </Text>
      </HStack>
      <Text fontSize="sm" color="muted" display={{ base: 'none', sm: 'block' }}>
        AWS plans, powered by Amazon Bedrock
      </Text>
    </Flex>
  );
}
